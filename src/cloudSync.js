// Camada de sincronização com o Firestore.
//
// Cada turma, aluno, registro e observação vira um documento numa coleção
// própria (mesmo "id" usado localmente também é o id do documento no
// Firestore). As situações/critérios e o nome do professor atual ficam num
// único documento de configuração, por serem poucos dados editados em bloco.
//
// subscribeToData ouve as 4 coleções + o documento de config e entrega,
// a cada mudança (inclusive as feitas por outro dispositivo), o mesmo
// formato de "state" que o resto do sistema já usa — nenhum componente
// precisa saber que os dados vêm do Firestore.

import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  writeBatch,
} from 'firebase/firestore'
import { db, aguardarAutenticacao } from './firebase'
import { uid } from './utils'
import { SITUACOES_PADRAO } from './situacoesPadrao'

const COLECOES = ['turmas', 'alunos', 'registros', 'observacoesPeriodo']
const CONFIG_PATH = ['configuracoes', 'geral']

export async function subscribeToData(onData) {
  await aguardarAutenticacao()

  const cache = { turmas: [], alunos: [], registros: [], observacoesPeriodo: [], situacoes: SITUACOES_PADRAO, professorAtual: '' }
  const emit = () => onData({ ...cache })

  const unsubs = COLECOES.map((nome) =>
    onSnapshot(collection(db, nome), (snap) => {
      cache[nome] = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      emit()
    })
  )

  const configRef = doc(db, ...CONFIG_PATH)
  const unsubConfig = onSnapshot(configRef, (snap) => {
    if (snap.exists()) {
      const d = snap.data()
      cache.situacoes = d.situacoes && d.situacoes.length ? d.situacoes : SITUACOES_PADRAO
      cache.professorAtual = d.professorAtual || ''
    } else {
      // primeira vez: cria o documento de configuração com os valores padrão
      setDoc(configRef, { situacoes: SITUACOES_PADRAO, professorAtual: '' }).catch(console.error)
    }
    emit()
  })

  return () => {
    unsubs.forEach((u) => u())
    unsubConfig()
  }
}

async function excluirRelacionados(campo, valor) {
  const batch = writeBatch(db)
  for (const nome of ['alunos', 'registros', 'observacoesPeriodo']) {
    if (nome === 'alunos' && campo !== 'turmaId') continue
    const snap = await getDocs(collection(db, nome))
    snap.docs.forEach((d) => {
      if (d.data()[campo] === valor) batch.delete(d.ref)
    })
  }
  await batch.commit()
}

// ---------- turmas ----------
export async function criarTurma({ nome, disciplina, professor, ano }) {
  await setDoc(doc(db, 'turmas', uid('turma')), { nome, disciplina: disciplina || '—', professor: professor || '', ano })
}
export async function excluirTurma(id) {
  await excluirRelacionados('turmaId', id)
  await deleteDoc(doc(db, 'turmas', id))
}

// ---------- alunos ----------
function alunoNovoDoc(nome, matricula, turmaId) {
  return {
    nome,
    matricula: matricula || '',
    turmaId,
    turmaOrigemId: turmaId,
    historicoTurmas: [{ turmaId, data: new Date().toISOString() }],
  }
}
export async function adicionarAluno(nome, matricula, turmaId) {
  await setDoc(doc(db, 'alunos', uid('aluno')), alunoNovoDoc(nome, matricula, turmaId))
}
export async function importarAlunos(rows, turmaId) {
  const batch = writeBatch(db)
  rows.filter((r) => r.nome.trim()).forEach((r) => {
    batch.set(doc(db, 'alunos', uid('aluno')), alunoNovoDoc(r.nome.trim(), r.matricula.trim(), turmaId))
  })
  await batch.commit()
}
export async function excluirAluno(id) {
  await deleteDoc(doc(db, 'alunos', id))
}
export async function moverAluno(alunoAtual, novaTurmaId) {
  if (alunoAtual.turmaId === novaTurmaId) return
  const origemId = alunoAtual.turmaOrigemId || alunoAtual.turmaId
  const historico = alunoAtual.historicoTurmas || [{ turmaId: alunoAtual.turmaId, data: new Date().toISOString() }]
  await updateDoc(doc(db, 'alunos', alunoAtual.id), {
    turmaOrigemId: origemId,
    turmaId: novaTurmaId,
    historicoTurmas: [...historico, { turmaId: novaTurmaId, data: new Date().toISOString() }],
  })
}

// ---------- registros ----------
export async function salvarRegistro(reg) {
  await setDoc(doc(db, 'registros', uid('reg')), reg)
}
export async function salvarRegistrosEmLote(alunoIds, base) {
  const batch = writeBatch(db)
  alunoIds.forEach((alunoId) => batch.set(doc(db, 'registros', uid('reg')), { alunoId, ...base }))
  await batch.commit()
}
export async function excluirRegistro(id) {
  await deleteDoc(doc(db, 'registros', id))
}

// ---------- observações do período ----------
export async function salvarObservacoes(chave, existenteId, observacoes, outros) {
  if (existenteId) {
    await updateDoc(doc(db, 'observacoesPeriodo', existenteId), { observacoes, outros })
  } else {
    await setDoc(doc(db, 'observacoesPeriodo', uid('obs')), { ...chave, observacoes, outros })
  }
}

// ---------- critérios / configurações ----------
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
export async function salvarProfessorAtual(nome) {
  await patchConfig({ professorAtual: nome })
}

// ---------- dados de exemplo (tela Painel, quando vazia) ----------
export async function carregarDemoNoFirestore(turma, alunos, registros, professorAtual) {
  await patchConfig({ professorAtual })
  await setDoc(doc(db, 'turmas', turma.id), {
    nome: turma.nome,
    disciplina: turma.disciplina,
    professor: turma.professor,
    ano: turma.ano,
  })
  const batchAlunos = writeBatch(db)
  alunos.forEach((a) => {
    const { id, ...resto } = a
    batchAlunos.set(doc(db, 'alunos', id), resto)
  })
  await batchAlunos.commit()
  const batchRegs = writeBatch(db)
  registros.forEach((r) => {
    const { id, ...resto } = r
    batchRegs.set(doc(db, 'registros', id), resto)
  })
  await batchRegs.commit()
}
// ---------- backup ----------
// Substitui TODOS os dados do Firestore pelos dados de um arquivo de backup.
export async function restaurarBackupNoFirestore(novoEstado) {
  for (const nome of COLECOES) {
    const snap = await getDocs(collection(db, nome))
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
        batch.set(doc(db, nome, id || uid(nome.slice(0, 4))), resto)
      })
      await batch.commit()
    }
  }
  await setDoc(doc(db, ...CONFIG_PATH), {
    situacoes: novoEstado.situacoes || SITUACOES_PADRAO,
    professorAtual: novoEstado.professorAtual || '',
  })
}
