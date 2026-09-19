import { useMemo, useState } from 'react'
import { turmaOrigemId } from '../utils'
import { extrairAlunosDoPdf } from '../rosterPdf'

export default function Turmas({ data, ui, patchUi, actions, alunosDaTurma }) {
  const turma = ui.turmaId ? data.turmas.find((t) => t.id === ui.turmaId) : null
  if (turma) return <TurmaDetail data={data} ui={ui} patchUi={patchUi} actions={actions} turma={turma} alunosDaTurma={alunosDaTurma} />
  return <ListaTurmas data={data} patchUi={patchUi} actions={actions} alunosDaTurma={alunosDaTurma} />
}

function ListaTurmas({ data, patchUi, actions, alunosDaTurma }) {
  const [mostrarForm, setMostrarForm] = useState(false)
  const [nome, setNome] = useState('')
  const [disciplina, setDisciplina] = useState('')
  const [professor, setProfessor] = useState('')
  const [ano, setAno] = useState(String(new Date().getFullYear()))

  function salvarTurma() {
    if (!nome.trim()) {
      actions.notify('Informe o nome da turma.')
      return
    }
    actions.criarTurma({ nome: nome.trim(), disciplina: disciplina.trim(), professor: professor.trim(), ano: ano.trim() })
    setNome('')
    setDisciplina('')
    setProfessor('')
    setMostrarForm(false)
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Cadastro de Turma</h1>
          <div className="sub">Crie turmas e gerencie os alunos de cada uma</div>
        </div>
        <button className="btn btn-primary" onClick={() => setMostrarForm((v) => !v)}>
          + Nova turma
        </button>
      </div>

      {mostrarForm && (
        <div className="card">
          <h3 style={{ marginBottom: 14 }}>Nova turma</h3>
          <div className="row">
            <div className="field">
              <label>Nome da turma</label>
              <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: 3º ADM T1" />
            </div>
            <div className="field">
              <label>Disciplina</label>
              <input type="text" value={disciplina} onChange={(e) => setDisciplina(e.target.value)} placeholder="Ex.: Gestão de Pessoas" />
            </div>
          </div>
          <div className="row">
            <div className="field">
              <label>Professor(a)</label>
              <input type="text" value={professor} onChange={(e) => setProfessor(e.target.value)} placeholder="Nome do(a) professor(a)" />
            </div>
            <div className="field">
              <label>Ano letivo</label>
              <input type="text" value={ano} onChange={(e) => setAno(e.target.value)} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-primary" onClick={salvarTurma}>
              Salvar turma
            </button>
            <button className="btn btn-ghost" onClick={() => setMostrarForm(false)}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {data.turmas.length === 0 ? (
        <div className="card empty">
          <div className="ic">▤</div>
          <h3>Nenhuma turma cadastrada</h3>
          <p>Clique em "Nova turma" para começar.</p>
        </div>
      ) : (
        <div className="grid cols-3">
          {data.turmas.map((t) => (
            <div key={t.id} className="card" style={{ cursor: 'pointer' }} onClick={() => patchUi({ turmaId: t.id })}>
              <h3 style={{ fontSize: 17 }}>{t.nome}</h3>
              <div style={{ color: 'var(--text-secondary)', fontSize: 13.5, margin: '4px 0 10px' }}>
                {t.disciplina} · {t.ano}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{(alunosDaTurma[t.id] || []).length} aluno(s)</div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}

function TurmaDetail({ data, ui, patchUi, actions, turma, alunosDaTurma }) {
  const alunos = alunosDaTurma[turma.id] || []
  const outrasTurmas = data.turmas.filter((t) => t.id !== turma.id)
  const [mostrarAddAluno, setMostrarAddAluno] = useState(false)
  const [nomeAluno, setNomeAluno] = useState('')
  const [matAluno, setMatAluno] = useState('')
  const [busca, setBusca] = useState('')
  const [importRows, setImportRows] = useState(null)
  const [lendoPdf, setLendoPdf] = useState(false)

  const alunosFiltrados = useMemo(() => {
    const q = busca.trim().toLowerCase()
    if (!q) return alunos
    return alunos.filter((a) => a.nome.toLowerCase().includes(q))
  }, [alunos, busca])

  async function onArquivoPdf(e) {
    const file = e.target.files[0]
    e.target.value = ''
    if (!file) return
    setLendoPdf(true)
    actions.notify('Lendo arquivo PDF…')
    try {
      const rows = await extrairAlunosDoPdf(file)
      if (rows.length === 0) {
        actions.notify('Não foi possível identificar alunos no PDF. Adicione manualmente.')
      } else {
        setImportRows(rows)
      }
    } catch (err) {
      console.error(err)
      actions.notify('Erro ao ler o PDF. Verifique o arquivo e tente novamente.')
    } finally {
      setLendoPdf(false)
    }
  }

  if (importRows) {
    return (
      <ImportPreview
        turma={turma}
        rows={importRows}
        setRows={setImportRows}
        onCancelar={() => setImportRows(null)}
        onConfirmar={() => {
          actions.importarAlunos(importRows, turma.id)
          setImportRows(null)
        }}
      />
    )
  }

  return (
    <>
      <div className="page-head">
        <div>
          <button className="btn btn-ghost btn-sm" style={{ marginBottom: 10 }} onClick={() => patchUi({ turmaId: null })}>
            ← Todas as turmas
          </button>
          <h1>{turma.nome}</h1>
          <div className="sub">
            {turma.disciplina} · Prof. {turma.professor || '—'} · {turma.ano}
          </div>
        </div>
        <button
          className="btn btn-danger btn-sm"
          onClick={() => {
            if (window.confirm('Excluir esta turma e todos os seus alunos/registros associados?')) actions.excluirTurma(turma.id)
          }}
        >
          Excluir turma
        </button>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
          <h3>Alunos ({alunos.length})</h3>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setMostrarAddAluno((v) => !v)}>
              + Adicionar aluno
            </button>
            <label className="btn btn-accent btn-sm" style={{ margin: 0 }}>
              {lendoPdf ? 'Lendo…' : '⭱ Importar lista (PDF)'}
              <input type="file" accept="application/pdf" style={{ display: 'none' }} onChange={onArquivoPdf} disabled={lendoPdf} />
            </label>
          </div>
        </div>

        {mostrarAddAluno && (
          <div className="row" style={{ marginBottom: 16 }}>
            <div className="field">
              <label>Nome do aluno</label>
              <input type="text" value={nomeAluno} onChange={(e) => setNomeAluno(e.target.value)} />
            </div>
            <div className="field">
              <label>Matrícula</label>
              <input type="text" value={matAluno} onChange={(e) => setMatAluno(e.target.value)} />
            </div>
            <div className="field" style={{ flex: 0, display: 'flex', alignItems: 'flex-end' }}>
              <button
                className="btn btn-primary"
                onClick={() => {
                  if (!nomeAluno.trim()) {
                    actions.notify('Informe o nome do aluno.')
                    return
                  }
                  actions.adicionarAluno(nomeAluno.trim(), matAluno.trim(), turma.id)
                  setNomeAluno('')
                  setMatAluno('')
                }}
              >
                Adicionar
              </button>
            </div>
          </div>
        )}

        {alunos.length === 0 ? (
          <div className="empty">
            <div className="ic">✎</div>
            <h3>Nenhum aluno nesta turma</h3>
            <p>Adicione manualmente ou importe uma lista em PDF.</p>
          </div>
        ) : (
          <>
            {alunos.length > 6 && (
              <div className="toolbar">
                <div className="field">
                  <input type="text" placeholder="Buscar aluno por nome…" value={busca} onChange={(e) => setBusca(e.target.value)} />
                </div>
              </div>
            )}
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Matrícula</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {alunosFiltrados.map((a) => (
                    <tr key={a.id}>
                      <td>
                        {a.nome}
                        {turmaOrigemId(a) !== a.turmaId && (
                          <>
                            <br />
                            <span className="badge neutro" style={{ marginTop: 4 }}>
                              Veio de {data.turmas.find((t) => t.id === turmaOrigemId(a))?.nome || '—'}
                            </span>
                          </>
                        )}
                      </td>
                      <td>{a.matricula || '—'}</td>
                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        {outrasTurmas.length > 0 && (
                          <select
                            defaultValue=""
                            style={{ width: 'auto', display: 'inline-block', padding: '5px 8px', fontSize: 12.5, marginRight: 6 }}
                            onChange={(e) => {
                              if (!e.target.value) return
                              const destino = data.turmas.find((t) => t.id === e.target.value)
                              if (window.confirm(`Mover ${a.nome} para a turma "${destino.nome}"? A turma de origem continuará registrada no relatório do aluno.`)) {
                                actions.moverAluno(a.id, e.target.value)
                              }
                              e.target.value = ''
                            }}
                          >
                            <option value="">Mover para…</option>
                            {outrasTurmas.map((ot) => (
                              <option key={ot.id} value={ot.id}>
                                {ot.nome}
                              </option>
                            ))}
                          </select>
                        )}
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => {
                            if (window.confirm('Excluir este aluno da turma? Registros associados serão mantidos no histórico.')) actions.excluirAluno(a.id)
                          }}
                        >
                          Excluir
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </>
  )
}

function ImportPreview({ turma, rows, setRows, onCancelar, onConfirmar }) {
  return (
    <>
      <div className="page-head">
        <div>
          <h1>Importar lista de alunos</h1>
          <div className="sub">Confira e ajuste antes de confirmar — turma: {turma.nome}</div>
        </div>
      </div>
      <div className="card">
        <p style={{ color: 'var(--text-secondary)', fontSize: 13.5, marginBottom: 14 }}>
          {rows.length} registro(s) encontrado(s) no arquivo. Corrija nome/matrícula se necessário e remova linhas indevidas antes de confirmar.
        </p>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Matrícula</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  <td>
                    <input
                      type="text"
                      value={r.nome}
                      onChange={(e) => setRows(rows.map((row, idx) => (idx === i ? { ...row, nome: e.target.value } : row)))}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      style={{ width: 140 }}
                      value={r.matricula}
                      onChange={(e) => setRows(rows.map((row, idx) => (idx === i ? { ...row, matricula: e.target.value } : row)))}
                    />
                  </td>
                  <td>
                    <button className="btn btn-sm btn-danger" onClick={() => setRows(rows.filter((_, idx) => idx !== i))}>
                      Remover
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
          <button className="btn btn-primary" onClick={onConfirmar}>
            Confirmar importação ({rows.length})
          </button>
          <button className="btn btn-ghost" onClick={onCancelar}>
            Cancelar
          </button>
        </div>
      </div>
    </>
  )
}
