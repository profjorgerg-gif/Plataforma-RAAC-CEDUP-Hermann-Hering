import { useMemo, useState } from 'react'
import { CRITERIOS, OBSERVACOES_OPCOES, PERIODOS, NOTA_ALERTA } from '../situacoesPadrao'
import {
  registrosDoPeriodo,
  notaPeriodo,
  notaBadgeClass,
  badgeClassForDesconto,
  criterioLabel,
  reincidenciaSugerida,
  todayISO,
  fmtData,
} from '../utils'

export default function Avaliacao({ data, ui, patchUi, actions, alunosDaTurma }) {
  const [busca, setBusca] = useState('')
  const [selecionados, setSelecionados] = useState([])
  const [regModalAlunoId, setRegModalAlunoId] = useState(null)
  const [loteModalAberto, setLoteModalAberto] = useState(false)

  if (data.turmas.length === 0) {
    return (
      <>
        <div className="page-head">
          <div>
            <h1>Avaliação RAAC</h1>
          </div>
        </div>
        <div className="card empty">
          <div className="ic">✎</div>
          <h3>Nenhuma turma cadastrada</h3>
          <p>Cadastre uma turma antes de lançar registros.</p>
        </div>
      </>
    )
  }

  const turmaId = ui.turmaId || data.turmas[0].id
  if (!ui.turmaId) patchUi({ turmaId })
  const turma = data.turmas.find((t) => t.id === turmaId) || data.turmas[0]
  const alunos = alunosDaTurma[turma.id] || []
  const alunosBaixaNota = alunos.filter((a) => notaPeriodo(data.registros, a.id, turma.id, ui.periodo, ui.ano) < NOTA_ALERTA)

  const alunosFiltrados = useMemo(() => {
    const q = busca.trim().toLowerCase()
    if (!q) return alunos
    return alunos.filter((a) => a.nome.toLowerCase().includes(q))
  }, [alunos, busca])

  function toggleSelecionado(id) {
    setSelecionados((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))
  }
  function selecionarTodos(marcar) {
    setSelecionados(marcar ? alunosFiltrados.map((a) => a.id) : [])
  }

  function mudarContexto(patch) {
    setSelecionados([])
    patchUi(patch)
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Avaliação RAAC</h1>
          <div className="sub">Nota parte de 10 · só lance um registro quando houver ocorrência</div>
        </div>
      </div>

      <div className="card">
        <div className="row">
          <div className="field">
            <label>Turma</label>
            <select value={turma.id} onChange={(e) => mudarContexto({ turmaId: e.target.value })}>
              {data.turmas.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nome}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Período</label>
            <select value={ui.periodo} onChange={(e) => mudarContexto({ periodo: e.target.value })}>
              {PERIODOS.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </div>
          <div className="field" style={{ maxWidth: 110 }}>
            <label>Ano</label>
            <input type="text" value={ui.ano} onChange={(e) => mudarContexto({ ano: e.target.value || ui.ano })} />
          </div>
        </div>
      </div>

      {alunosBaixaNota.length > 0 && (
        <div className="alert-card">
          <h4>⚠ {alunosBaixaNota.length} aluno(s) com nota abaixo de {NOTA_ALERTA.toFixed(1)} neste período</h4>
          {alunosBaixaNota.map((a) => (
            <span className="chip" key={a.id}>
              {a.nome} — {notaPeriodo(data.registros, a.id, turma.id, ui.periodo, ui.ano).toFixed(1)}
            </span>
          ))}
        </div>
      )}

      <div className="card">
        <h3 style={{ marginBottom: 6 }}>
          {turma.nome} · {turma.disciplina}
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 14 }}>
          {ui.periodo} · {ui.ano} · {alunos.length} aluno(s)
        </p>

        {alunos.length === 0 ? (
          <div className="empty">
            <div className="ic">✎</div>
            <h3>Sem alunos nesta turma</h3>
            <p>Vá em Cadastro de Turma para adicionar alunos.</p>
          </div>
        ) : (
          <>
            <div className="toolbar">
              {alunos.length > 6 && (
                <div className="field">
                  <input type="text" placeholder="Buscar aluno por nome…" value={busca} onChange={(e) => setBusca(e.target.value)} />
                </div>
              )}
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500, fontSize: 13.5, color: 'var(--text)', marginBottom: 0, whiteSpace: 'nowrap' }}>
                <input
                  type="checkbox"
                  style={{ width: 16, height: 16 }}
                  checked={alunosFiltrados.length > 0 && selecionados.length === alunosFiltrados.length}
                  onChange={(e) => selecionarTodos(e.target.checked)}
                />{' '}
                Selecionar todos
              </label>
              <button className="btn btn-accent btn-sm" disabled={selecionados.length === 0} onClick={() => setLoteModalAberto(true)}>
                Lançar registro em lote ({selecionados.length})
              </button>
            </div>

            <div>
              {alunosFiltrados.map((a) => {
                const regs = registrosDoPeriodo(data.registros, a.id, turma.id, ui.periodo, ui.ano)
                const nota = notaPeriodo(data.registros, a.id, turma.id, ui.periodo, ui.ano)
                return (
                  <div className="student-row" key={a.id}>
                    <div className="student-left">
                      <input type="checkbox" checked={selecionados.includes(a.id)} onChange={() => toggleSelecionado(a.id)} />
                      <div style={{ minWidth: 0 }}>
                        <div className="student-name">{a.nome}</div>
                        <div className="student-mat">
                          Matrícula {a.matricula || '—'} {regs.length ? `· ${regs.length} registro(s)` : '· sem registros'}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                      <span className={`badge ${notaBadgeClass(nota)}`}>Nota {nota.toFixed(1)}</span>
                      <button className="btn btn-sm btn-ghost" onClick={() => setRegModalAlunoId(a.id)}>
                        Ver registros
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      {regModalAlunoId && (
        <RegistrosModal
          data={data}
          ui={ui}
          actions={actions}
          turma={turma}
          alunoId={regModalAlunoId}
          onFechar={() => setRegModalAlunoId(null)}
        />
      )}

      {loteModalAberto && (
        <LoteModal
          data={data}
          ui={ui}
          actions={actions}
          turma={turma}
          alunoIds={selecionados}
          onFechar={() => setLoteModalAberto(false)}
          onAplicado={() => {
            setLoteModalAberto(false)
            setSelecionados([])
          }}
        />
      )}
    </>
  )
}

function situacaoOptions(situacoes) {
  return CRITERIOS.map((c) => (
    <optgroup key={c.key} label={c.label}>
      {situacoes
        .filter((s) => s.criterio === c.key)
        .map((s) => (
          <option key={s.codigo} value={s.codigo}>
            {s.codigo} — {s.label} (-{s.desconto.toFixed(1)})
          </option>
        ))}
    </optgroup>
  ))
}

function RegistrosModal({ data, ui, actions, turma, alunoId, onFechar }) {
  const aluno = data.alunos.find((a) => a.id === alunoId)
  const regs = registrosDoPeriodo(data.registros, alunoId, turma.id, ui.periodo, ui.ano)
  const nota = notaPeriodo(data.registros, alunoId, turma.id, ui.periodo, ui.ano)
  const obsExistente = data.observacoesPeriodo.find(
    (o) => o.alunoId === alunoId && o.turmaId === turma.id && o.periodo === ui.periodo && o.ano === ui.ano
  )
  const sugestao = reincidenciaSugerida(data.situacoes, regs)

  const [mostrarForm, setMostrarForm] = useState(false)
  const [situacaoCod, setSituacaoCod] = useState(sugestao ? sugestao.codigo : data.situacoes[0]?.codigo || '')
  const [dataReg, setDataReg] = useState(todayISO())
  const [obsReg, setObsReg] = useState('')

  const [obsSel, setObsSel] = useState(obsExistente ? obsExistente.observacoes : [])
  const [outros, setOutros] = useState(obsExistente ? obsExistente.outros || '' : '')

  const temLancadoPor = regs.some((r) => r.lancadoPor)

  function salvarRegistro() {
    const sit = data.situacoes.find((s) => s.codigo === situacaoCod)
    if (!sit) {
      actions.notify('Selecione a situação observada.')
      return
    }
    actions.salvarRegistro({
      alunoId,
      turmaId: turma.id,
      periodo: ui.periodo,
      ano: ui.ano,
      criterio: sit.criterio,
      situacaoCodigo: sit.codigo,
      situacaoLabel: sit.label,
      desconto: sit.desconto,
      data: dataReg || todayISO(),
      observacao: obsReg.trim(),
      lancadoPor: data.professorAtual || '',
    })
    setObsReg('')
    setMostrarForm(false)
  }

  function toggleObs(i) {
    setObsSel((sel) => (sel.includes(OBSERVACOES_OPCOES[i]) ? sel.filter((o) => o !== OBSERVACOES_OPCOES[i]) : [...sel, OBSERVACOES_OPCOES[i]]))
  }

  return (
    <div className="modal-bg" onClick={(e) => e.target === e.currentTarget && onFechar()}>
      <div className="modal">
        <h2 style={{ fontSize: 19 }}>{aluno?.nome}</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 16 }}>
          {turma.nome} · {ui.periodo} · {ui.ano}
        </p>

        <div className="nota-final" style={{ marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', fontWeight: 700 }}>NOTA ATUAL</div>
            <div className="val">{nota.toFixed(1)}</div>
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>
            Parte de 10 · desconta {regs.reduce((s, r) => s + r.desconto, 0)} ponto(s) em {regs.length} registro(s)
          </div>
        </div>

        <h4 style={{ fontSize: 15, marginBottom: 8 }}>Registros do período</h4>
        {regs.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', fontSize: 13.5, marginBottom: 16 }}>Nenhum registro neste período — nota automática de 10,0.</p>
        ) : (
          <div className="table-wrap" style={{ marginBottom: 16 }}>
            <table>
              <thead>
                <tr>
                  <th>Critério</th>
                  <th>Situação observada</th>
                  <th>Desconto</th>
                  <th>Data</th>
                  <th>Observação</th>
                  {temLancadoPor && <th>Lançado por</th>}
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {regs.map((r) => (
                  <tr key={r.id}>
                    <td>{criterioLabel(r.criterio)}</td>
                    <td>
                      <span className={`badge ${badgeClassForDesconto(r.desconto)}`}>
                        {r.situacaoCodigo} {r.situacaoLabel}
                      </span>
                    </td>
                    <td>-{r.desconto.toFixed(1)}</td>
                    <td>{fmtData(r.data)}</td>
                    <td style={{ maxWidth: 160, fontSize: 12.5, color: 'var(--text-secondary)' }}>{r.observacao || '—'}</td>
                    {temLancadoPor && <td style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>{r.lancadoPor || '—'}</td>}
                    <td>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => {
                          if (window.confirm('Excluir este registro?')) actions.excluirRegistro(r.id)
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
        )}

        <button className="btn btn-accent btn-sm" style={{ marginBottom: 16 }} onClick={() => setMostrarForm((v) => !v)}>
          + Novo registro
        </button>
        {mostrarForm && (
          <div style={{ marginBottom: 20 }}>
            {sugestao && (
              <div className="note-card">
                ⚠ Já existe um registro de <strong>{sugestao.reincidenciaDe}</strong> neste período — sugerido abaixo:{' '}
                <strong>
                  {sugestao.codigo} {sugestao.label}
                </strong>{' '}
                (reincidência).
              </div>
            )}
            <div className="field">
              <label>Situação observada</label>
              <select value={situacaoCod} onChange={(e) => setSituacaoCod(e.target.value)}>
                {situacaoOptions(data.situacoes)}
              </select>
            </div>
            <div className="row">
              <div className="field" style={{ maxWidth: 180 }}>
                <label>Data</label>
                <input type="date" value={dataReg} onChange={(e) => setDataReg(e.target.value)} />
              </div>
            </div>
            <div className="field">
              <label>Observação (opcional)</label>
              <textarea value={obsReg} onChange={(e) => setObsReg(e.target.value)} placeholder="Detalhe adicional sobre a ocorrência…" />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-primary" onClick={salvarRegistro}>
                Salvar registro
              </button>
              <button className="btn btn-ghost" onClick={() => setMostrarForm(false)}>
                Cancelar
              </button>
            </div>
          </div>
        )}

        <div className="crit-group">
          <h4>Observações gerais do período</h4>
          <div className="obs-list">
            {OBSERVACOES_OPCOES.map((o, i) => (
              <label className="obs-item" key={i}>
                <input type="checkbox" checked={obsSel.includes(o)} onChange={() => toggleObs(i)} />
                <span>{o}</span>
              </label>
            ))}
          </div>
          <div className="field" style={{ marginTop: 10 }}>
            <label>Outros</label>
            <textarea value={outros} onChange={(e) => setOutros(e.target.value)} placeholder="Comentário adicional…" />
          </div>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => actions.salvarObservacoes({ alunoId, turmaId: turma.id, periodo: ui.periodo, ano: ui.ano }, obsSel, outros.trim())}
          >
            Salvar observações
          </button>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <button className="btn btn-primary" onClick={onFechar}>
            Concluído
          </button>
        </div>
      </div>
    </div>
  )
}

function LoteModal({ data, ui, actions, turma, alunoIds, onFechar, onAplicado }) {
  const nomes = alunoIds.map((id) => data.alunos.find((a) => a.id === id)).filter(Boolean)
  const [situacaoCod, setSituacaoCod] = useState(data.situacoes[0]?.codigo || '')
  const [dataReg, setDataReg] = useState(todayISO())
  const [obsReg, setObsReg] = useState('')

  function aplicar() {
    const sit = data.situacoes.find((s) => s.codigo === situacaoCod)
    if (!sit) {
      actions.notify('Selecione a situação observada.')
      return
    }
    actions.salvarRegistrosEmLote(alunoIds, {
      turmaId: turma.id,
      periodo: ui.periodo,
      ano: ui.ano,
      criterio: sit.criterio,
      situacaoCodigo: sit.codigo,
      situacaoLabel: sit.label,
      desconto: sit.desconto,
      data: dataReg || todayISO(),
      observacao: obsReg.trim(),
      lancadoPor: data.professorAtual || '',
    })
    onAplicado()
  }

  return (
    <div className="modal-bg" onClick={(e) => e.target === e.currentTarget && onFechar()}>
      <div className="modal">
        <h2 style={{ fontSize: 19 }}>Lançar registro em lote</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 14 }}>
          {turma.nome} · {ui.periodo} · {ui.ano} · {nomes.length} aluno(s) selecionado(s)
        </p>
        <div style={{ marginBottom: 16 }}>
          {nomes.map((a) => (
            <span className="chip" key={a.id}>
              {a.nome}
            </span>
          ))}
        </div>
        <div className="field">
          <label>Situação observada</label>
          <select value={situacaoCod} onChange={(e) => setSituacaoCod(e.target.value)}>
            {situacaoOptions(data.situacoes)}
          </select>
        </div>
        <div className="row">
          <div className="field" style={{ maxWidth: 180 }}>
            <label>Data</label>
            <input type="date" value={dataReg} onChange={(e) => setDataReg(e.target.value)} />
          </div>
        </div>
        <div className="field">
          <label>Observação (opcional, aplicada a todos)</label>
          <textarea value={obsReg} onChange={(e) => setObsReg(e.target.value)} placeholder="Detalhe adicional sobre a ocorrência…" />
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-primary" onClick={aplicar}>
            Aplicar a {nomes.length} aluno(s)
          </button>
          <button className="btn btn-ghost" onClick={onFechar}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}
