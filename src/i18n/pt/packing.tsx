import type { Messages } from '../en'

export const packing: Messages['packing'] = {
  whoIsBringing: 'Quem leva',
  nobodyYet: 'Ninguém ainda',
  title: 'Bagagem e tarefas',
  empty: 'Ainda não há nada aqui',
  progress: (packed, total) => `${packed} de ${total} na mala`,
  packedLabel: (text) => `Na mala: ${text}`,
  addFromTemplate: 'Adicionar a partir de um modelo',
  addAnItem: 'Adicionar um item',
  item: 'Item',
  deleteConfirm: 'Eliminar este item?',
}
