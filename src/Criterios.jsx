import { useState } from 'react'
import { CRITERIOS } from '../situacoesPadrao'
import { criterioLabel } from '../utils'

export default function Criterios({ data, actions, perfil }) {
  const [editCodigo, setEditCodigo] = useState(null) // codigo da situação em edição, ou 'novo', ou null
  const souMestre = !perfil || perfil.role === 'mestre' // sem Firebase configurado, libera tudo (modo local)

  const editando = editCodigo && editCodigo !== 'novo' ? data.situacoes.find((s) => s.codigo === editCodigo) : null
  const mostrarForm = souMestre && editCodigo !== null

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Critérios & Configurações</h1>
          <div className="sub">Tabela de descontos usada nos registros</div>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
          <h3>Tabela de critérios e descontos</h3>
          {souMestre && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-accent btn-sm" onClick={() => setEditCodigo('novo')}>
                + Nova situação
              </button>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  if (window.confirm('Restaurar a tabela de critérios para os valores padrão? Suas alterações na tabela serão perdidas (os registros já lançados não são afetados).')) {
                    actions.restaurarSituacoesPadrao()
                  }
                }}
              >
                Restaurar padrão
              </button>
            </div>
          )}
        </div>

        {!souMestre && (
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 14 }}>
            Somente o usuário mestre pode editar esta tabela. Fale com a coordenação se algum valor precisar mudar.
          </p>
        )}

        {mostrarForm && (
          <SituacaoForm
            data={data}
            editando={editando}
            onCancelar={() => setEditCodigo(null)}
            onSalvar={(situacao) => {
              actions.salvarSituacao(situacao, editando ? editando.codigo : null)
              setEditCodigo(null)
            }}
          />
        )}

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Código</th>
                <th>Critério</th>
                <th>Situação observada</th>
                <th>Desconto</th>
                <th>Reincidência de</th>
                {souMestre && <th></th>}
              </tr>
            </thead>
            <tbody>
              {data.situacoes.map((s) => (
                <tr key={s.codigo}>
                  <td>{s.codigo}</td>
                  <td>{criterioLabel(s.criterio)}</td>
                  <td>{s.label}</td>
                  <td>-{s.desconto.toFixed(1)}</td>
                  <td>{s.reincidenciaDe || '—'}</td>
                  {souMestre && (
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <button className="btn btn-sm btn-ghost" onClick={() => setEditCodigo(s.codigo)}>
                        Editar
                      </button>{' '}
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => {
                          if (window.confirm('Excluir esta situação da tabela de critérios? Registros já lançados com ela são mantidos no histórico.')) {
                            actions.excluirSituacao(s.codigo)
                          }
                        }}
                      >
                        Excluir
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

function SituacaoForm({ data, editando, onCancelar, onSalvar }) {
  const [codigo, setCodigo] = useState(editando ? editando.codigo : '')
  const [criterio, setCriterio] = useState(editando ? editando.criterio : CRITERIOS[0].key)
  const [desconto, setDesconto] = useState(editando ? editando.desconto : 1.0)
  const [label, setLabel] = useState(editando ? editando.label : '')
  const [reincidenciaDe, setReincidenciaDe] = useState(editando ? editando.reincidenciaDe || '' : '')

  function salvar() {
    const descontoNum = parseFloat(desconto)
    if (!codigo.trim() || !label.trim() || isNaN(descontoNum) || descontoNum <= 0) {
      window.alert('Preencha código, situação e um desconto válido.')
      return
    }
    if (!editando && data.situacoes.some((s) => s.codigo === codigo.trim())) {
      window.alert('Já existe uma situação com esse código.')
      return
    }
    onSalvar({ codigo: codigo.trim(), criterio, label: label.trim(), desconto: descontoNum, reincidenciaDe: reincidenciaDe || null })
  }

  return (
    <div style={{ marginBottom: 20, border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 16 }}>
      <h4 style={{ fontSize: 15, marginBottom: 10 }}>{editando ? 'Editar situação' : 'Nova situação'}</h4>
      <div className="row">
        <div className="field" style={{ maxWidth: 120 }}>
          <label>Código</label>
          <input type="text" value={codigo} onChange={(e) => setCodigo(e.target.value)} placeholder="Ex.: 1.3" readOnly={!!editando} />
        </div>
        <div className="field">
          <label>Critério</label>
          <select value={criterio} onChange={(e) => setCriterio(e.target.value)}>
            {CRITERIOS.map((c) => (
              <option key={c.key} value={c.key}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div className="field" style={{ maxWidth: 140 }}>
          <label>Desconto</label>
          <input type="number" min="0.5" step="0.5" value={desconto} onChange={(e) => setDesconto(e.target.value)} />
        </div>
      </div>
      <div className="field">
        <label>Situação observada</label>
        <input type="text" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Ex.: Uso indevido do laboratório" />
      </div>
      <div className="field">
        <label>É reincidência de… (opcional)</label>
        <select value={reincidenciaDe} onChange={(e) => setReincidenciaDe(e.target.value)}>
          <option value="">Nenhuma</option>
          {data.situacoes
            .filter((s) => !editando || s.codigo !== editando.codigo)
            .map((s) => (
              <option key={s.codigo} value={s.codigo}>
                {s.codigo} — {s.label}
              </option>
            ))}
        </select>
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button className="btn btn-primary" onClick={salvar}>
          Salvar situação
        </button>
        <button className="btn btn-ghost" onClick={onCancelar}>
          Cancelar
        </button>
      </div>
    </div>
  )
}
