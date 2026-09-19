import { useState } from 'react'
import { PERIODOS } from '../situacoesPadrao'
import {
  registrosDoPeriodo,
  notaPeriodo,
  notaBadgeClass,
  badgeClassForDesconto,
  criterioLabel,
  turmaOrigemId,
  fmtData,
  downloadCSV,
} from '../utils'

export default function Relatorios({ data, ui, patchUi, alunosDaTurma }) {
  const [tab, setTab] = useState('turma')
  const [relTurmaId, setRelTurmaId] = useState(ui.turmaId || (data.turmas[0] && data.turmas[0].id))
  const [relAlunoId, setRelAlunoId] = useState(data.alunos[0] && data.alunos[0].id)

  if (data.turmas.length === 0) {
    return (
      <>
        <div className="page-head">
          <div>
            <h1>Relatórios</h1>
          </div>
        </div>
        <div className="card empty">
          <div className="ic">▦</div>
          <h3>Nenhum dado ainda</h3>
          <p>Cadastre turmas e alunos para gerar relatórios.</p>
        </div>
      </>
    )
  }

  function exportarCSV() {
    if (tab === 'turma') {
      const turma = data.turmas.find((t) => t.id === relTurmaId) || data.turmas[0]
      const alunos = alunosDaTurma[turma.id] || []
      const rows = alunos.map((a) => {
        const regs = registrosDoPeriodo(data.registros, a.id, turma.id, ui.periodo, ui.ano)
        const nota = notaPeriodo(data.registros, a.id, turma.id, ui.periodo, ui.ano)
        return [a.nome, a.matricula || '', regs.length, regs.reduce((s, r) => s + r.desconto, 0).toFixed(1), nota.toFixed(1)]
      })
      downloadCSV(
        `raac_${turma.nome}_${ui.periodo}_${ui.ano}.csv`.replace(/\s+/g, '_'),
        ['Aluno', 'Matrícula', 'Registros', 'Desconto total', 'Nota'],
        rows
      )
    } else {
      const aluno = data.alunos.find((a) => a.id === relAlunoId)
      if (!aluno) return
      const registros = data.registros
        .filter((r) => r.alunoId === relAlunoId)
        .sort((x, y) => (x.ano + x.periodo).localeCompare(y.ano + y.periodo) || new Date(x.data) - new Date(y.data))
      const rows = registros.map((r) => [
        r.periodo,
        r.ano,
        (data.turmas.find((t) => t.id === r.turmaId) || {}).nome || '—',
        criterioLabel(r.criterio),
        `${r.situacaoCodigo} ${r.situacaoLabel}`,
        r.desconto.toFixed(1),
        fmtData(r.data),
        r.observacao || '',
        r.lancadoPor || '',
      ])
      downloadCSV(`raac_${aluno.nome}.csv`.replace(/\s+/g, '_'), ['Período', 'Ano', 'Turma', 'Critério', 'Situação', 'Desconto', 'Data', 'Observação', 'Lançado por'], rows)
    }
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Relatórios</h1>
          <div className="sub">Consolidado por turma ou histórico individual</div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn btn-ghost" onClick={exportarCSV}>
            ⭳ Exportar CSV
          </button>
          <button className="btn btn-ghost" onClick={() => window.print()}>
            🖶 Imprimir / PDF
          </button>
        </div>
      </div>

      <div className="tabs">
        <button className={`tab ${tab === 'turma' ? 'active' : ''}`} onClick={() => setTab('turma')}>
          Por turma
        </button>
        <button className={`tab ${tab === 'aluno' ? 'active' : ''}`} onClick={() => setTab('aluno')}>
          Individual por aluno
        </button>
      </div>

      {tab === 'turma' ? (
        <RelatorioTurma data={data} ui={ui} patchUi={patchUi} alunosDaTurma={alunosDaTurma} relTurmaId={relTurmaId} setRelTurmaId={setRelTurmaId} />
      ) : (
        <RelatorioAluno data={data} relAlunoId={relAlunoId} setRelAlunoId={setRelAlunoId} />
      )}
    </>
  )
}

function RelatorioTurma({ data, ui, patchUi, alunosDaTurma, relTurmaId, setRelTurmaId }) {
  const turma = data.turmas.find((t) => t.id === relTurmaId) || data.turmas[0]
  const alunos = alunosDaTurma[turma.id] || []

  return (
    <>
      <div className="card">
        <div className="row">
          <div className="field">
            <label>Turma</label>
            <select value={turma.id} onChange={(e) => setRelTurmaId(e.target.value)}>
              {data.turmas.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nome}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Período</label>
            <select value={ui.periodo} onChange={(e) => patchUi({ periodo: e.target.value })}>
              {PERIODOS.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </div>
          <div className="field" style={{ maxWidth: 110 }}>
            <label>Ano</label>
            <input type="text" value={ui.ano} onChange={(e) => patchUi({ ano: e.target.value || ui.ano })} />
          </div>
        </div>
      </div>
      <div className="card">
        <h3 style={{ marginBottom: 4 }}>
          {turma.nome} — {turma.disciplina}
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 14 }}>
          {ui.periodo} · {ui.ano}
        </p>
        {alunos.length === 0 ? (
          <div className="empty">
            <p>Nenhum aluno nesta turma.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Aluno</th>
                  <th>Registros</th>
                  <th>Desconto total</th>
                  <th>Nota</th>
                </tr>
              </thead>
              <tbody>
                {alunos.map((a) => {
                  const regs = registrosDoPeriodo(data.registros, a.id, turma.id, ui.periodo, ui.ano)
                  const nota = notaPeriodo(data.registros, a.id, turma.id, ui.periodo, ui.ano)
                  const totalDesc = regs.reduce((s, r) => s + r.desconto, 0)
                  return (
                    <tr key={a.id}>
                      <td>{a.nome}</td>
                      <td>{regs.length}</td>
                      <td>{regs.length ? '-' + totalDesc.toFixed(1) : '—'}</td>
                      <td>
                        <span className={`badge ${notaBadgeClass(nota)}`}>{nota.toFixed(1)}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}

function RelatorioAluno({ data, relAlunoId, setRelAlunoId }) {
  const aluno = data.alunos.find((a) => a.id === relAlunoId)
  if (!aluno) return <div className="card empty"><p>Nenhum aluno cadastrado.</p></div>

  const turma = data.turmas.find((t) => t.id === aluno.turmaId)
  const origemId = turmaOrigemId(aluno)
  const trocouDeTurma = origemId !== aluno.turmaId
  const hist = aluno.historicoTurmas && aluno.historicoTurmas.length > 1 ? aluno.historicoTurmas : null

  const registros = data.registros
    .filter((r) => r.alunoId === relAlunoId)
    .sort((x, y) => (x.ano + x.periodo).localeCompare(y.ano + y.periodo) || new Date(x.data) - new Date(y.data))

  const combos = []
  registros.forEach((r) => {
    const k = r.ano + '|' + r.periodo + '|' + r.turmaId
    if (!combos.find((c) => c.k === k)) combos.push({ k, ano: r.ano, periodo: r.periodo, turmaId: r.turmaId })
  })

  const nomeTurma = (id) => (data.turmas.find((t) => t.id === id) || {}).nome || '—'

  return (
    <>
      <div className="card">
        <div className="field" style={{ maxWidth: 340 }}>
          <label>Aluno</label>
          <select value={relAlunoId} onChange={(e) => setRelAlunoId(e.target.value)}>
            {data.alunos
              .slice()
              .sort((x, y) => x.nome.localeCompare(y.nome, 'pt-BR'))
              .map((x) => (
                <option key={x.id} value={x.id}>
                  {x.nome}
                </option>
              ))}
          </select>
        </div>
      </div>
      <div className="card">
        <h3>{aluno.nome}</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13.5, marginBottom: 4 }}>Matrícula {aluno.matricula || '—'}</p>
        {trocouDeTurma ? (
          <>
            <p style={{ fontSize: 13.5, marginBottom: 6 }}>
              <strong>Turma de origem:</strong> {nomeTurma(origemId)} &nbsp;·&nbsp; <strong>Turma atual:</strong> {turma?.nome || '—'}
            </p>
            {hist && (
              <div className="table-wrap" style={{ marginBottom: 16 }}>
                <table>
                  <thead>
                    <tr>
                      <th>Turma</th>
                      <th>Desde</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hist.map((h, i) => (
                      <tr key={i}>
                        <td>{nomeTurma(h.turmaId)}</td>
                        <td>{fmtData(h.data)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : (
          <p style={{ fontSize: 13.5, marginBottom: 16 }}>
            <strong>Turma:</strong> {turma?.nome || '—'}
          </p>
        )}

        {combos.length === 0 ? (
          <div className="empty">
            <p>Nenhum registro de ocorrência para este aluno — nota 10,0 em todos os períodos avaliados.</p>
          </div>
        ) : (
          combos.map((combo) => {
            const nota = notaPeriodo(data.registros, relAlunoId, combo.turmaId, combo.periodo, combo.ano)
            const regsCombo = registros.filter((r) => r.ano === combo.ano && r.periodo === combo.periodo && r.turmaId === combo.turmaId)
            const temLancadoPor = regsCombo.some((r) => r.lancadoPor)
            return (
              <div style={{ marginBottom: 20 }} key={combo.k}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
                  <strong style={{ fontSize: 14.5 }}>
                    {combo.periodo} · {combo.ano}
                    {trocouDeTurma ? ` · ${nomeTurma(combo.turmaId)}` : ''}
                  </strong>
                  <span className={`badge ${notaBadgeClass(nota)}`}>Nota {nota.toFixed(1)}</span>
                </div>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Critério</th>
                        <th>Situação observada</th>
                        <th>Desconto</th>
                        <th>Data</th>
                        <th>Observação</th>
                        {temLancadoPor && <th>Lançado por</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {regsCombo.map((r) => (
                        <tr key={r.id}>
                          <td>{criterioLabel(r.criterio)}</td>
                          <td>
                            <span className={`badge ${badgeClassForDesconto(r.desconto)}`}>
                              {r.situacaoCodigo} {r.situacaoLabel}
                            </span>
                          </td>
                          <td>-{r.desconto.toFixed(1)}</td>
                          <td>{fmtData(r.data)}</td>
                          <td style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>{r.observacao || '—'}</td>
                          {temLancadoPor && <td style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>{r.lancadoPor || '—'}</td>}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          })
        )}
      </div>
    </>
  )
}
