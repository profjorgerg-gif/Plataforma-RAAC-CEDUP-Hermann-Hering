// Tabela oficial de critérios e descontos (anexo do CEDUP Hermann Hering).
// Usada como valor de fábrica — o professor pode editar em "Critérios & Config."
// dentro do próprio sistema; isto aqui é só o ponto de partida.

export const CRITERIOS = [
  { key: 'responsabilidade', label: 'Responsabilidade' },
  { key: 'assiduidade', label: 'Assiduidade' },
  { key: 'atitude', label: 'Atitude' },
  { key: 'comprometimento', label: 'Comprometimento' },
]

export const SITUACOES_PADRAO = [
  { codigo: '1.1', criterio: 'responsabilidade', label: 'Falta de material', desconto: 1.0, reincidenciaDe: null },
  { codigo: '1.2', criterio: 'responsabilidade', label: 'Atividade não entregue', desconto: 2.0, reincidenciaDe: null },
  { codigo: '2.1', criterio: 'assiduidade', label: 'Chegada tardia', desconto: 1.0, reincidenciaDe: null },
  { codigo: '3.1', criterio: 'atitude', label: 'Comportamento inadequado/indisciplina', desconto: 2.0, reincidenciaDe: null },
  { codigo: '3.2', criterio: 'atitude', label: 'Falta de uso de uniforme', desconto: 2.0, reincidenciaDe: null },
  { codigo: '3.3', criterio: 'atitude', label: 'Fora do espelho de classe', desconto: 1.0, reincidenciaDe: null },
  { codigo: '4.1', criterio: 'comprometimento', label: 'Uso de celular em sala de aula', desconto: 1.0, reincidenciaDe: null },
  { codigo: '4.2', criterio: 'comprometimento', label: 'Reincidência no uso de celular', desconto: 2.0, reincidenciaDe: '4.1' },
]

export const OBSERVACOES_OPCOES = [
  'Evoluiu significativamente neste período.',
  'Necessita melhorar organização e responsabilidade.',
  'Deve aprimorar frequência e pontualidade.',
  'Precisa desenvolver postura adequada em sala.',
  'Demonstrou ótimo engajamento e compromisso.',
]

export const PERIODOS = ['1º Trimestre', '2º Trimestre', '3º Trimestre']

// Abaixo desse valor, o aluno entra na lista de "atenção" na tela de Avaliação RAAC.
export const NOTA_ALERTA = 6.0
