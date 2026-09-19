import { CRITERIOS } from './situacoesPadrao'

export function uid(prefix) {
  return prefix + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

export function fmtData(iso) {
  try {
    return new Date(iso).toLocaleDateString('pt-BR')
  } catch {
    return iso
  }
}

export function criterioLabel(key) {
  const c = CRITERIOS.find((x) => x.key === key)
  return c ? c.label : key
}

export function situacaoByCodigo(situacoes, cod) {
  return situacoes.find((s) => s.codigo === cod)
}

// Nota do período: parte de 10 e cada registro desconta pontos, acumulando.
// Sem nenhum registro no período, a nota fica 10 (autoavaliação).
export function registrosDoPeriodo(registros, alunoId, turmaId, periodo, ano) {
  return registros
    .filter((r) => r.alunoId === alunoId && r.turmaId === turmaId && r.periodo === periodo && r.ano === ano)
    .sort((a, b) => new Date(b.data) - new Date(a.data))
}

export function notaPeriodo(registros, alunoId, turmaId, periodo, ano) {
  const regs = registrosDoPeriodo(registros, alunoId, turmaId, periodo, ano)
  if (regs.length === 0) return 10
  const totalDesconto = regs.reduce((s, r) => s + r.desconto, 0)
  return Math.max(0, Math.min(10, Math.round((10 - totalDesconto) * 10) / 10))
}

export function badgeClassForDesconto(desconto) {
  return desconto >= 2 ? 'insuficiente' : 'regular'
}

export function notaBadgeClass(nota) {
  if (nota === null || nota === undefined) return 'neutro'
  if (nota >= 9) return 'excelente'
  if (nota >= 6) return 'bom'
  if (nota >= 3) return 'regular'
  return 'insuficiente'
}

export function reincidenciaSugerida(situacoes, regs) {
  const codigosUsados = new Set(regs.map((r) => r.situacaoCodigo))
  return situacoes.find((s) => s.reincidenciaDe && codigosUsados.has(s.reincidenciaDe) && !codigosUsados.has(s.codigo))
}

export function criarAluno(nome, matricula, turmaId) {
  return {
    id: uid('aluno'),
    nome,
    matricula,
    turmaId,
    turmaOrigemId: turmaId,
    historicoTurmas: [{ turmaId, data: new Date().toISOString() }],
  }
}

export function turmaOrigemId(aluno) {
  return (
    aluno.turmaOrigemId ||
    (aluno.historicoTurmas && aluno.historicoTurmas[0] && aluno.historicoTurmas[0].turmaId) ||
    aluno.turmaId
  )
}

export function csvEscape(v) {
  return `"${String(v === undefined || v === null ? '' : v).replace(/"/g, '""')}"`
}

export function downloadCSV(filename, headers, rows) {
  const lines = [headers.map(csvEscape).join(';')].concat(rows.map((r) => r.map(csvEscape).join(';')))
  const blob = new Blob(['\uFEFF' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' })
  triggerDownload(blob, filename)
}

export function downloadJSON(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  triggerDownload(blob, filename)
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
