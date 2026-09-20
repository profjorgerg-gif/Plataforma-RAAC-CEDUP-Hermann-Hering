// Camada de sincronização com o Firestore.
//
// Cada turma, aluno, registro e observação vira um documento numa coleção
// própria, sempre com um campo "professorUid": o dono do dado. Um professor
// só vê (e as regras do Firestore só liberam) os documentos com o seu
// próprio professorUid; o usuário mestre vê todos, independente do dono.
// As situações/critérios ficam num único documento de configuração,
// compartilhado e editável só pelo mestre.

import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  writeBatch,
} from 'firebase/firestore'
import { db } from './firebase'
import { uid } from './utils'
import { SITUACOES_PADRAO } from './situacoesPadrao'

const COLECOES = ['turmas', 'alunos', 'registros', 'observacoesPeriodo']
const CONFIG_PATH = ['configuracoes', 'geral']

// Garante que existe um documento usuarios/{uid} para a pessoa que acabou de
// logar. Na primeira vez, cria com o papel "professor" — só o usuário mestre
// (promovido manualmente pelo console do Firebase) pode ver/editar tudo.
export async function garantirUsuario(user) {
  const ref = doc(db, 'usuarios', user.uid)
  const snap = await getDoc(ref)
  if (snap.exists()) {
    return { uid: user.uid, email: user.email, role: snap.data().role || 'professor' }
  }
  await setDoc(ref, { email: user.email, role: 'professor' })
  return { uid: user.uid, email: user.email, role: 'professor' }
}

export async function subscribeToData(onData, perfil) {
  const cache = { turmas: [], alunos: [], registros: [], observacoesPeriodo: [], situacoes: SITUACOES_PADRAO }
  const emit = () => onData({ ...cache })

  const souMestre = perfil.role === 'mestre'
  const unsubs = COLECOES.map((nome) => {
    const ref = souMestre ? collection(db, nome) : query(collection(db, nome), where('professorUid', '==', perfil.uid))
    return onSnapshot(
      ref,
      (snap) => {
        cache[nome] = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
        emit()
      },
      (err) => console.error(`Falha ao sincronizar ${nome}:`, err)
    )
  })

  const configRef = doc(db, ...CONFIG_PATH)
  const unsubConfig = onSnapshot(configRef, (snap) => {
    if (snap.exists()) {
      const d = snap.data()
      cache.situacoes = d.situacoes && d.situacoes.length ? d.situacoes : SITUACOES_PADRAO
    } else if (souMestre) {
      setDoc(configRef, { situacoes: SITUACOES_PADRAO }).catch(console.error)
    }
    emit()
  })

  return () => {
    unsubs.forEach((u) => u())
    unsubConfig()
  }
}

async function excluirRelacionados(turmaId) {
  const batch = writeBatch(db)
  for (const nome of ['alunos', 'registros', 'observacoesPeriodo']) {
    const snap = await getDocs(query(collection(db, nome), where('turmaId', '==', turmaId)))
    snap.docs.forEach((d) => batch.delete(d.ref))
  }
  await batch.commit()
}

// ---------- turmas ----------
export async function criarTurma({ nome, disciplina, professor, ano }, professorUid) {
  await setDoc(doc(db, 'turmas', uid('turma')), {
    nome,
    disciplina: disciplina || '—',
    professor: professor || '',
    ano,
    professorUid,
  })
}
export async function excluirTurma(id) {
  await excluirRelacionados(id)
  await deleteDoc(doc(db, 'turmas', id))
}

// ---------- alunos ----------
function alunoNovoDoc(nome, matricula, turmaId, professorUid) {
  return {
    nome,
    matricula: matricula || '',
    turmaId,
    turmaOrigemId: turmaId,
    historicoTurmas: [{ turmaId, data: new Date().toISOString() }],
    professorUid,
  }
}
export async function adicionarAluno(nome, matricula, turmaId, professorUid) {
  await setDoc(doc(db, 'alunos', uid('aluno')), alunoNovoDoc(nome, matricula, turmaId, professorUid))
}
export async function importarAlunos(rows, turmaId, professorUid) {
  const batch = writeBatch(db)
  rows.filter((r) => r.nome.trim()).forEach((r) => {
    batch.set(doc(db, 'alunos', uid('aluno')), alunoNovoDoc(r.nome.trim(), r.matricula.trim(), turmaId, professorUid))
  })
  await batch.commit()
}
export async function excluirAluno(id) {
  await deleteDoc(doc(db, 'alunos', id))
}
export async function moverAluno(alunoAtual, novaTurmaId, novoProfessorUid) {
  if (alunoAtual.turmaId === novaTurmaId) return
  const origemId = alunoAtual.turmaOrigemId || alunoAtual.turmaId
  const historico = alunoAtual.historicoTurmas || [{ turmaId: alunoAtual.turmaId, data: new Date().toISOString() }]
  await updateDoc(doc(db, 'alunos', alunoAtual.id), {
    turmaOrigemId: origemId,
    turmaId: novaTurmaId,
    professorUid: novoProfessorUid,
    historicoTurmas: [...historico, { turmaId: novaTurmaId, data: new Date().toISOString() }],
  })
}

// ---------- registros ----------
export async function salvarRegistro(reg, professorUid) {
  await setDoc(doc(db, 'registros', uid('reg')), { ...reg, professorUid })
}
export async function salvarRegistrosEmLote(alunoIds, base, professorUid) {
  const batch = writeBatch(db)
  alunoIds.forEach((alunoId) => batch.set(doc(db, 'registros', uid('reg')), { alunoId, ...base, professorUid }))
  await batch.commit()
}
export async function excluirRegistro(id) {
  await deleteDoc(doc(db, 'registros', id))
}

// ---------- observações do período ----------
export async function salvarObservacoes(chave, existenteId, observacoes, outros, professorUid) {
  if (existenteId) {
    await updateDoc(doc(db, 'observacoesPeriodo', existenteId), { observacoes, outros })
  } else {
    await setDoc(doc(db, 'observacoesPeriodo', uid('obs')), { ...chave, observacoes, outros, professorUid })
  }
}

// ---------- critérios (mestre) ----------
async function patchConfig(patch) {
  await setDoc(doc(db, ...CONFIG_PATH), patch, { merge: true })
}
export async function salvarSituacao(situacoesAtuais, situacao, codigoOriginal) {
  const existe = codigoOriginal && situacoesAtuais.some((s) => s.codigo === codigoOriginal)
  const situacoes = existe ? situacoesAtuais.map((s) => (s.codigo === codigoOriginal ? situacao : s)) : [...situacoesAtuais, situacao]
  await patchConfig({ situacoes })
}
export async function excluirSituacao(situacoesAtuais, codigo) {
  await patchConfig({ situacoes: situacoesAtuais.filter((s) => s.codigo !== codigo) })
}
export async function restaurarSituacoesPadrao() {
  await patchConfig({ situacoes: JSON.parse(JSON.stringify(SITUACOES_PADRAO)) })
}

// ---------- dados de exemplo (tela Painel, quando vazia) ----------
export async function carregarDemoNoFirestore(turma, alunos, registros, professorUid) {
  await setDoc(doc(db, 'turmas', turma.id), {
    nome: turma.nome,
    disciplina: turma.disciplina,
    professor: turma.professor,
    ano: turma.ano,
    professorUid,
  })
  const batchAlunos = writeBatch(db)
  alunos.forEach((a) => {
    const { id, ...resto } = a
    batchAlunos.set(doc(db, 'alunos', id), { ...resto, professorUid })
  })
  await batchAlunos.commit()
  const batchRegs = writeBatch(db)
  registros.forEach((r) => {
    const { id, ...resto } = r
    batchRegs.set(doc(db, 'registros', id), { ...resto, professorUid })
  })
  await batchRegs.commit()
}

// ---------- backup ----------
// Substitui TODOS os dados do dono atual no Firestore pelos dados de um
// arquivo de backup (mantém os dados de outros professores intactos).
export async function restaurarBackupNoFirestore(novoEstado, professorUid, souMestre) {
  for (const nome of COLECOES) {
    const ref = souMestre ? collection(db, nome) : query(collection(db, nome), where('professorUid', '==', professorUid))
    const snap = await getDocs(ref)
    const lote = snap.docs
    for (let i = 0; i < lote.length; i += 400) {
      const batch = writeBatch(db)
      lote.slice(i, i + 400).forEach((d) => batch.delete(d.ref))
      await batch.commit()
    }
  }
  for (const nome of COLECOES) {
    const itens = novoEstado[nome] || []
    for (let i = 0; i < itens.length; i += 400) {
      const batch = writeBatch(db)
      itens.slice(i, i + 400).forEach((item) => {
        const { id, ...resto } = item
        batch.set(doc(db, nome, id || uid(nome.slice(0, 4))), { ...resto, professorUid: resto.professorUid || professorUid })
      })
      await batch.commit()
    }
  }
  if (souMestre) {
    await setDoc(doc(db, ...CONFIG_PATH), { situacoes: novoEstado.situacoes || SITUACOES_PADRAO })
  }
}
