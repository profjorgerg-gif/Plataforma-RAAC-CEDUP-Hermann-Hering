// Camada de persistência dos dados do sistema.
//
// Hoje (antes da Etapa 3 do checklist) tudo é salvo em localStorage, exatamente
// como no protótipo — cada professor usa o navegador do seu próprio
// computador/tablet/celular, sem sincronização entre dispositivos.
//
// Quando o Firebase for configurado (firebaseAtivo === true em firebaseConfig.js),
// este é o único arquivo que precisa mudar: trocar loadState/saveState por leitura
// e escrita no Firestore, mantendo o mesmo formato de "state" usado no resto do
// sistema (nenhum componente React precisa ser alterado).

import { SITUACOES_PADRAO } from './situacoesPadrao'
import { firebaseAtivo } from './firebaseConfig'

export const STORAGE_KEY = 'raac_v1'

export function estadoInicial() {
  return {
    turmas: [],
    alunos: [],
    registros: [],
    observacoesPeriodo: [],
    situacoes: JSON.parse(JSON.stringify(SITUACOES_PADRAO)),
    professorAtual: '',
  }
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return estadoInicial()
    const state = JSON.parse(raw)
    return sanitizeState(state)
  } catch (e) {
    console.warn('Falha ao carregar dados salvos', e)
    return estadoInicial()
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (e) {
    console.warn('Falha ao salvar', e)
  }
  // TODO (Etapa 3): quando firebaseAtivo for true, além de salvar localmente
  // (bom para funcionar offline), gravar também no Firestore para sincronizar
  // entre dispositivos e professores.
  void firebaseAtivo
}

export function sanitizeState(state) {
  const base = estadoInicial()
  return {
    turmas: state.turmas || base.turmas,
    alunos: state.alunos || base.alunos,
    registros: state.registros || base.registros,
    observacoesPeriodo: state.observacoesPeriodo || base.observacoesPeriodo,
    situacoes: state.situacoes || base.situacoes,
    professorAtual: state.professorAtual !== undefined ? state.professorAtual : base.professorAtual,
  }
}
