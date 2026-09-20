import { useEffect, useMemo, useRef, useState } from 'react'
import { loadState, saveState, estadoInicial } from './dataStore'
import { firebaseAtivo, aoMudarAutenticacao, sair } from './firebase'
import * as cloud from './cloudSync'
import { SITUACOES_PADRAO, PERIODOS } from './situacoesPadrao'
import { uid, criarAluno, downloadJSON } from './utils'

import Login from './components/Login.jsx'
import Sidebar from './components/Sidebar.jsx'
import Dashboard from './components/Dashboard.jsx'
import Turmas from './components/Turmas.jsx'
import Avaliacao from './components/Avaliacao.jsx'
import Relatorios from './components/Relatorios.jsx'
import Criterios from './components/Criterios.jsx'
import Backup from './components/Backup.jsx'
import Toast from './components/Toast.jsx'

const anoAtual = String(new Date().getFullYear())

export default function App() {
  // user: undefined = ainda verificando · null = deslogado · objeto = logado
  const [user, setUser] = useState(firebaseAtivo ? undefined : null)
  const [perfil, setPerfil] = useState(null) // { uid, email, role }
  const [data, setData] = useState(() => (firebaseAtivo ? estadoInicial() : loadState()))
  const [carregando, setCarregando] = useState(firebaseAtivo)
  const [erroConexao, setErroConexao] = useState(null)
  const [ui, setUi] = useState({
    view: 'dashboard',
    turmaId: null,
    periodo: PERIODOS[0],
    ano: anoAtual,
    relTurmaId: null,
    relAlunoId: null,
    relTab: 'turma',
    sidebarOpen: false,
  })
  const [toast, setToast] = useState(null)
  const toastTimer = useRef(null)

  // Observa o login/logout.
  useEffect(() => {
    if (!firebaseAtivo) return
    return aoMudarAutenticacao(setUser)
  }, [])

  // Assim que alguém loga, garante o perfil (usuarios/{uid}) e liga a
  // sincronização em tempo real com o Firestore, já filtrada por dono
  // (ou sem filtro, se for o usuário mestre).
  useEffect(() => {
    if (!firebaseAtivo || !user) return
    let unsub
    let cancelado = false
    setCarregando(true)
    cloud
      .garantirUsuario(user)
      .then((p) => {
        if (cancelado) return
        setPerfil(p)
        return cloud.subscribeToData((d) => {
          if (cancelado) return
          setData(d)
          setCarregando(false)
        }, p)
      })
      .then((u) => {
        if (cancelado) u && u()
        else unsub = u
      })
      .catch((err) => {
        console.error(err)
        setErroConexao(err.message || String(err))
        setCarregando(false)
      })
    return () => {
      cancelado = true
      if (unsub) unsub()
    }
  }, [user])

  // Sem Firebase configurado: continua salvando no navegador, como o protótipo.
  useEffect(() => {
    if (!firebaseAtivo) saveState(data)
  }, [data])

  function notify(msg) {
    setToast(msg)
    window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(null), 2600)
  }
  function avisarErro(err) {
    console.error(err)
    notify('Não foi possível salvar agora — verifique sua conexão.')
  }

  function patchUi(patch) {
    setUi((u) => ({ ...u, ...patch }))
  }

  function turmaAtual(turmaId) {
    return data.turmas.find((t) => t.id === turmaId)
  }
  const meuUid = perfil ? perfil.uid : null

  // ---------- ações: turmas ----------
  function criarTurma({ nome, disciplina, professor, ano }) {
    if (firebaseAtivo) {
      cloud.criarTurma({ nome, disciplina, professor, ano }, meuUid).catch(avisarErro)
    } else {
      setData((d) => ({
        ...d,
        turmas: [...d.turmas, { id: uid('turma'), nome, disciplina: disciplina || '—', professor, ano: ano || anoAtual }],
      }))
    }
    notify('Turma criada.')
  }
  function excluirTurma(id) {
    if (firebaseAtivo) {
      cloud.excluirTurma(id).catch(avisarErro)
    } else {
      setData((d) => ({
        ...d,
        turmas: d.turmas.filter((t) => t.id !== id),
        alunos: d.alunos.filter((a) => a.turmaId !== id),
        registros: d.registros.filter((r) => r.turmaId !== id),
        observacoesPeriodo: d.observacoesPeriodo.filter((o) => o.turmaId !== id),
      }))
    }
    patchUi({ turmaId: null })
    notify('Turma excluída.')
  }

  // ---------- ações: alunos ----------
  function adicionarAluno(nome, matricula, turmaId) {
    const dono = firebaseAtivo ? (turmaAtual(turmaId) || {}).professorUid || meuUid : null
    if (firebaseAtivo) {
      cloud.adicionarAluno(nome, matricula, turmaId, dono).catch(avisarErro)
    } else {
      setData((d) => ({ ...d, alunos: [...d.alunos, criarAluno(nome, matricula, turmaId)] }))
    }
    notify('Aluno adicionado.')
  }
  function importarAlunos(rows, turmaId) {
    const dono = firebaseAtivo ? (turmaAtual(turmaId) || {}).professorUid || meuUid : null
    if (firebaseAtivo) {
      cloud.importarAlunos(rows, turmaId, dono).catch(avisarErro)
    } else {
      setData((d) => ({
        ...d,
        alunos: [...d.alunos, ...rows.filter((r) => r.nome.trim()).map((r) => criarAluno(r.nome.trim(), r.matricula.trim(), turmaId))],
      }))
    }
    notify(`${rows.length} aluno(s) importado(s).`)
  }
  function excluirAluno(id) {
    if (firebaseAtivo) {
      cloud.excluirAluno(id).catch(avisarErro)
    } else {
      setData((d) => ({ ...d, alunos: d.alunos.filter((a) => a.id !== id) }))
    }
    notify('Aluno excluído.')
  }
  function moverAluno(alunoId, novaTurmaId) {
    const aluno = data.alunos.find((a) => a.id === alunoId)
    if (!aluno || aluno.turmaId === novaTurmaId) return
    if (firebaseAtivo) {
      const novoDono = (turmaAtual(novaTurmaId) || {}).professorUid || meuUid
      cloud.moverAluno(aluno, novaTurmaId, novoDono).catch(avisarErro)
    } else {
      setData((d) => ({
        ...d,
        alunos: d.alunos.map((a) => {
          if (a.id !== alunoId) return a
          const origemId = a.turmaOrigemId || a.turmaId
          const historico = a.historicoTurmas || [{ turmaId: a.turmaId, data: new Date().toISOString() }]
          return {
            ...a,
            turmaOrigemId: origemId,
            turmaId: novaTurmaId,
            historicoTurmas: [...historico, { turmaId: novaTurmaId, data: new Date().toISOString() }],
          }
        }),
      }))
    }
    notify('Aluno movido de turma.')
  }

  // ---------- ações: registros (ocorrências) ----------
  function salvarRegistro(reg) {
    const dono = firebaseAtivo ? (turmaAtual(reg.turmaId) || {}).professorUid || meuUid : null
    const regCompleto = { ...reg, lancadoPor: (perfil && perfil.email) || '' }
    if (firebaseAtivo) {
      cloud.salvarRegistro(regCompleto, dono).catch(avisarErro)
    } else {
      setData((d) => ({ ...d, registros: [...d.registros, { id: uid('reg'), ...regCompleto }] }))
    }
    notify('Registro salvo.')
  }
  function salvarRegistrosEmLote(alunoIds, base) {
    const dono = firebaseAtivo ? (turmaAtual(base.turmaId) || {}).professorUid || meuUid : null
    const baseCompleta = { ...base, lancadoPor: (perfil && perfil.email) || '' }
    if (firebaseAtivo) {
      cloud.salvarRegistrosEmLote(alunoIds, baseCompleta, dono).catch(avisarErro)
    } else {
      setData((d) => ({
        ...d,
        registros: [...d.registros, ...alunoIds.map((alunoId) => ({ id: uid('reg'), alunoId, ...baseCompleta }))],
      }))
    }
    notify(`Registro aplicado a ${alunoIds.length} aluno(s).`)
  }
  function excluirRegistro(id) {
    if (firebaseAtivo) {
      cloud.excluirRegistro(id).catch(avisarErro)
    } else {
      setData((d) => ({ ...d, registros: d.registros.filter((r) => r.id !== id) }))
    }
    notify('Registro excluído.')
  }
  function salvarObservacoes(chave, observacoes, outros) {
    const existente = data.observacoesPeriodo.find(
      (o) => o.alunoId === chave.alunoId && o.turmaId === chave.turmaId && o.periodo === chave.periodo && o.ano === chave.ano
    )
    if (firebaseAtivo) {
      const dono = (turmaAtual(chave.turmaId) || {}).professorUid || meuUid
      cloud.salvarObservacoes(chave, existente ? existente.id : null, observacoes, outros, dono).catch(avisarErro)
    } else {
      setData((d) => {
        const lista = existente
          ? d.observacoesPeriodo.map((o) => (o.id === existente.id ? { ...o, observacoes, outros } : o))
          : [...d.observacoesPeriodo, { id: uid('obs'), ...chave, observacoes, outros }]
        return { ...d, observacoesPeriodo: lista }
      })
    }
    notify('Observações salvas.')
  }

  // ---------- ações: critérios/situações (somente mestre) ----------
  function salvarSituacao(situacao, codigoOriginal) {
    if (firebaseAtivo) {
      cloud.salvarSituacao(data.situacoes, situacao, codigoOriginal).catch(avisarErro)
    } else {
      setData((d) => {
        const existe = codigoOriginal && d.situacoes.some((s) => s.codigo === codigoOriginal)
        const situacoes = existe ? d.situacoes.map((s) => (s.codigo === codigoOriginal ? situacao : s)) : [...d.situacoes, situacao]
        return { ...d, situacoes }
      })
    }
    notify('Situação salva.')
  }
  function excluirSituacao(codigo) {
    if (firebaseAtivo) {
      cloud.excluirSituacao(data.situacoes, codigo).catch(avisarErro)
    } else {
      setData((d) => ({ ...d, situacoes: d.situacoes.filter((s) => s.codigo !== codigo) }))
    }
    notify('Situação excluída.')
  }
  function restaurarSituacoesPadrao() {
    if (firebaseAtivo) {
      cloud.restaurarSituacoesPadrao().catch(avisarErro)
    } else {
      setData((d) => ({ ...d, situacoes: JSON.parse(JSON.stringify(SITUACOES_PADRAO)) }))
    }
    notify('Tabela restaurada.')
  }

  // ---------- backup ----------
  function exportarBackup() {
    const ts = new Date().toISOString().replace(/[:.]/g, '-')
    downloadJSON(`backup_raac_${ts}.json`, data)
    notify('Backup baixado.')
  }
  function restaurarBackup(novoEstado) {
    if (firebaseAtivo) {
      notify('Restaurando backup no Firestore…')
      cloud
        .restaurarBackupNoFirestore(novoEstado, meuUid, perfil && perfil.role === 'mestre')
        .then(() => notify('Backup restaurado.'))
        .catch(avisarErro)
    } else {
      setData(novoEstado)
      notify('Backup restaurado.')
    }
  }

  // ---------- dados de exemplo (tela Painel, quando vazia) ----------
  function carregarDemo() {
    const turmaId = uid('turma')
    const ano = anoAtual
    const professorNome = (perfil && perfil.email) || 'Prof. Jorge Lima Cardoso'
    const nomes = [
      'Ana Beatriz Souza',
      'Carlos Eduardo Lima',
      'Débora Fernandes',
      'Eduardo Matos',
      'Fernanda Ribeiro',
      'Gustavo Henrique Alves',
    ]
    const alunosNovos = nomes.map((n, i) => criarAluno(n, String(20260000 + i), turmaId))
    const porNome = Object.fromEntries(alunosNovos.map((a) => [a.nome, a]))
    const addReg = (nome, codigo, observacao) => {
      const sit = SITUACOES_PADRAO.find((s) => s.codigo === codigo)
      return {
        id: uid('reg'),
        alunoId: porNome[nome].id,
        turmaId,
        periodo: PERIODOS[0],
        ano,
        criterio: sit.criterio,
        situacaoCodigo: sit.codigo,
        situacaoLabel: sit.label,
        desconto: sit.desconto,
        data: new Date().toISOString().slice(0, 10),
        observacao,
        lancadoPor: professorNome,
      }
    }
    const registrosNovos = [
      addReg('Carlos Eduardo Lima', '2.1', 'Chegou 15 minutos atrasado.'),
      addReg('Débora Fernandes', '1.2', 'Não entregou o estudo de caso.'),
      addReg('Débora Fernandes', '3.2', 'Veio sem o uniforme completo.'),
      addReg('Eduardo Matos', '4.1', 'Usou o celular durante a explicação.'),
      addReg('Fernanda Ribeiro', '1.2', 'Não entregou 2 atividades.'),
      addReg('Fernanda Ribeiro', '3.1', 'Discussão com colega em sala.'),
      addReg('Fernanda Ribeiro', '2.1', 'Chegou atrasada.'),
    ]
    const turma = { id: turmaId, nome: '3º ADM T1', disciplina: 'Gestão de Pessoas', professor: professorNome, ano }

    if (firebaseAtivo) {
      cloud.carregarDemoNoFirestore(turma, alunosNovos, registrosNovos, meuUid).catch(avisarErro)
    } else {
      setData((d) => ({
        ...d,
        turmas: [...d.turmas, turma],
        alunos: [...d.alunos, ...alunosNovos],
        registros: [...d.registros, ...registrosNovos],
      }))
    }
    notify('Dados de exemplo carregados.')
  }

  const alunosDaTurma = useMemo(() => {
    const map = {}
    data.turmas.forEach((t) => {
      map[t.id] = data.alunos.filter((a) => a.turmaId === t.id).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
    })
    return map
  }, [data.turmas, data.alunos])

  const actions = {
    notify,
    criarTurma,
    excluirTurma,
    adicionarAluno,
    importarAlunos,
    excluirAluno,
    moverAluno,
    salvarRegistro,
    salvarRegistrosEmLote,
    excluirRegistro,
    salvarObservacoes,
    salvarSituacao,
    excluirSituacao,
    restaurarSituacoesPadrao,
    exportarBackup,
    restaurarBackup,
    carregarDemo,
  }

  const MENU = [
    { id: 'dashboard', label: 'Painel', icon: '◧' },
    { id: 'turmas', label: 'Cadastro de Turma', icon: '▤' },
    { id: 'avaliacao', label: 'Avaliação RAAC', icon: '✎' },
    { id: 'relatorios', label: 'Relatórios', icon: '▦' },
    { id: 'criterios', label: 'Critérios & Config.', icon: '⚙' },
    { id: 'backup', label: 'Backup', icon: '⭳' },
  ]

  if (firebaseAtivo && user === undefined) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
        Verificando sessão…
      </div>
    )
  }
  if (firebaseAtivo && user === null) {
    return <Login />
  }
  if (carregando) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
        Conectando ao banco de dados…
      </div>
    )
  }
  if (erroConexao) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="card" style={{ maxWidth: 480, textAlign: 'center' }}>
          <h2>Não foi possível conectar</h2>
          <p style={{ color: 'var(--text-secondary)', margin: '10px 0' }}>{erroConexao}</p>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>
            Tentar novamente
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <div id="topbar">
        <button id="hamburger" aria-label="Abrir menu" onClick={() => patchUi({ sidebarOpen: true })}>
          ☰
        </button>
        <span className="brand-title">RAAC</span>
      </div>
      <div id="overlay" className={ui.sidebarOpen ? 'show' : ''} onClick={() => patchUi({ sidebarOpen: false })} />

      <div id="shell">
        <Sidebar menu={MENU} ui={ui} patchUi={patchUi} perfil={perfil} onSair={firebaseAtivo ? sair : null} onBackup={exportarBackup} />
        <main id="content">
          {ui.view === 'dashboard' && <Dashboard data={data} ui={ui} patchUi={patchUi} actions={actions} />}
          {ui.view === 'turmas' && (
            <Turmas data={data} ui={ui} patchUi={patchUi} actions={actions} alunosDaTurma={alunosDaTurma} />
          )}
          {ui.view === 'avaliacao' && (
            <Avaliacao data={data} ui={ui} patchUi={patchUi} actions={actions} alunosDaTurma={alunosDaTurma} />
          )}
          {ui.view === 'relatorios' && <Relatorios data={data} ui={ui} patchUi={patchUi} alunosDaTurma={alunosDaTurma} />}
          {ui.view === 'criterios' && <Criterios data={data} ui={ui} patchUi={patchUi} actions={actions} perfil={perfil} />}
          {ui.view === 'backup' && <Backup data={data} actions={actions} />}
        </main>
      </div>

      {toast && <Toast message={toast} />}
    </>
  )
}
