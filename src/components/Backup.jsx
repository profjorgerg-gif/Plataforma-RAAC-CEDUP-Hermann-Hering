import { useRef } from 'react'
import { sanitizeState } from '../dataStore'

export default function Backup({ data, actions }) {
  const inputRef = useRef(null)

  function onArquivo(e) {
    const file = e.target.files[0]
    e.target.value = ''
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result)
        if (!parsed.turmas || !parsed.alunos) throw new Error('formato inválido')
        if (window.confirm('Isso substituirá todos os dados atuais pelos dados do backup. Continuar?')) {
          actions.restaurarBackup(sanitizeState(parsed))
        }
      } catch {
        actions.notify('Arquivo inválido.')
      }
    }
    reader.readAsText(file)
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Backup</h1>
          <div className="sub">Exporte ou restaure os dados do sistema</div>
        </div>
      </div>
      <div className="grid cols-2">
        <div className="card">
          <h3>Exportar backup</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13.5, margin: '8px 0 16px' }}>
            Gera um arquivo .json com todas as turmas, alunos, registros e critérios configurados. Também é feito automaticamente ao usar
            "Backup e sair".
          </p>
          <button className="btn btn-primary" onClick={actions.exportarBackup}>
            ⭳ Baixar backup agora
          </button>
        </div>
        <div className="card">
          <h3>Restaurar backup</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13.5, margin: '8px 0 16px' }}>
            Carrega um arquivo .json exportado anteriormente. Isso substitui os dados atuais.
          </p>
          <input type="file" accept="application/json" ref={inputRef} style={{ display: 'none' }} onChange={onArquivo} />
          <button className="btn btn-ghost" onClick={() => inputRef.current.click()}>
            ⭱ Selecionar arquivo
          </button>
        </div>
      </div>
      <div className="card">
        <h3 style={{ marginBottom: 8 }}>Resumo atual</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
          {data.turmas.length} turma(s) · {data.alunos.length} aluno(s) · {data.registros.length} registro(s) de ocorrência
        </p>
      </div>
    </>
  )
}
