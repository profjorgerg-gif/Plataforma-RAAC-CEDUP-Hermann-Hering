// Importação de lista de alunos a partir de um PDF (ex.: relatório "Estudantes da
// Turma" do Professor Online / SED-SC). Extrai nome e matrícula de cada linha.
//
// Alguns relatórios exportam o PDF com cada caractere duplicado (efeito de negrito
// visual do sistema de origem) — por exemplo "ALANIS" vira "AALLAANNIISS". Este
// módulo detecta esse padrão e desfaz a duplicação antes de interpretar os dados.

import * as pdfjsLib from 'pdfjs-dist'
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.js?url'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker

export async function extrairAlunosDoPdf(file) {
  const buf = await file.arrayBuffer()
  const doc = await pdfjsLib.getDocument({ data: buf }).promise
  let lines = []
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p)
    const content = await page.getTextContent()
    const byY = {}
    content.items.forEach((it) => {
      const y = Math.round(it.transform[5])
      byY[y] = byY[y] || []
      byY[y].push(it)
    })
    Object.keys(byY)
      .sort((a, b) => b - a)
      .forEach((y) => {
        const items = byY[y].sort((a, b) => a.transform[4] - b.transform[4])
        lines.push(items.map((it) => it.str).join(' '))
      })
  }

  const fullText = lines.join(' ')
  if (textoEhDuplicado(fullText)) lines = lines.map(desduplicarCaracteres)

  let rows = lines
    .map((l) => l.replace(/[ \t]+/g, ' ').trim())
    .filter((l) => l.length > 1)
    .map(parseRosterLine)
    .filter((r) => r.matricula.length >= 5)

  if (rows.length === 0) {
    // Nenhuma linha com matrícula reconhecida — mantém linhas com nome plausível
    // para o professor completar manualmente na pré-visualização.
    rows = lines
      .map((l) => l.replace(/[ \t]+/g, ' ').trim())
      .filter((l) => l.length > 3)
      .map(parseRosterLine)
      .filter((r) => r.nome.length > 3)
  }
  return rows
}

export function textoEhDuplicado(text) {
  let total = 0
  let dup = 0
  for (let i = 0; i < text.length - 1; i++) {
    const c = text[i]
    if (c === ' ') continue
    total++
    if (text[i + 1] === c) dup++
  }
  return total > 20 && dup / total > 0.35
}

export function desduplicarCaracteres(line) {
  let out = ''
  let i = 0
  while (i < line.length) {
    const c = line[i]
    if (c !== ' ' && line[i + 1] === c) {
      out += c
      i += 2
    } else {
      out += c
      i += 1
    }
  }
  return out
}

export function parseRosterLine(line) {
  let l = line.trim()
  // remove data no fim da linha (ex.: 13/10/25)
  l = l.replace(/\d{2}\/\d{2}\/\d{2,4}\s*$/, '').trim()
  // matrícula = maior sequência de 5+ dígitos na linha
  const runs = l.match(/\d{5,}/g) || []
  const matricula = runs.length ? runs.reduce((a, b) => (b.length > a.length ? b : a)) : ''
  let nome = matricula ? l.replace(matricula, '') : l
  // remove número de ordem no início da linha (ex.: "1", "26")
  nome = nome.replace(/^\d{1,3}\s*/, '')
  nome = nome
    .replace(/[-–_.:;]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return { nome, matricula }
}
