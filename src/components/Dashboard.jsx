export default function Dashboard({ data, ui, patchUi, actions }) {
  if (data.turmas.length === 0) {
    return (
      <>
        <div className="page-head">
          <div>
            <h1>Painel</h1>
            <div className="sub">Visão geral do sistema RAAC</div>
          </div>
        </div>
        <div className="card empty">
          <div className="ic">▤</div>
          <h3>Nenhuma turma cadastrada ainda</h3>
          <p>Cadastre sua primeira turma para começar a registrar ocorrências RAAC.</p>
          <div style={{ marginTop: 16, display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={() => patchUi({ view: 'turmas' })}>
              Cadastrar turma
            </button>
            <button className="btn btn-ghost" onClick={() => actions.carregarDemo()}>
              Carregar dados de exemplo
            </button>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Painel</h1>
          <div className="sub">Visão geral do sistema RAAC</div>
        </div>
      </div>
      <div className="grid cols-3">
        <div className="card stat">
          <div className="num">{data.turmas.length}</div>
          <div className="lbl">Turmas cadastradas</div>
        </div>
        <div className="card stat">
          <div className="num">{data.alunos.length}</div>
          <div className="lbl">Alunos cadastrados</div>
        </div>
        <div className="card stat">
          <div className="num">{data.registros.length}</div>
          <div className="lbl">Registros de ocorrência lançados</div>
        </div>
      </div>
      <div className="card">
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 14 }}>
          Todo aluno começa o período com nota 10 (autoavaliação). A nota só cai quando há um registro de ocorrência lançado.
        </p>
        <h3 style={{ marginBottom: 12 }}>Turmas</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Turma</th>
                <th>Disciplina</th>
                <th>Ano</th>
                <th>Alunos</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {data.turmas.map((t) => (
                <tr key={t.id}>
                  <td>
                    <strong>{t.nome}</strong>
                  </td>
                  <td>{t.disciplina}</td>
                  <td>{t.ano}</td>
                  <td>{data.alunos.filter((a) => a.turmaId === t.id).length}</td>
                  <td>
                    <button
                      className="btn btn-sm btn-ghost"
                      onClick={() => patchUi({ view: 'avaliacao', turmaId: t.id })}
                    >
                      Ver registros
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

