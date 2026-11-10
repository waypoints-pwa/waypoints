import type { Messages } from '../en'
import { plural } from '../plural'

export const common: Messages['common'] = {
  mergeSummary: ({ added, updated, removed }) =>
    [
      added && `${added} ${added === 1 ? 'novo' : 'novos'}`,
      updated && `${updated} ${updated === 1 ? 'alterado' : 'alterados'}`,
      removed && `${removed} ${removed === 1 ? 'eliminado' : 'eliminados'}`,
    ]
      .filter(Boolean)
      .join(', ') || 'pequenas alterações',
  settings: 'Definições',
  yourTrips: 'As tuas viagens',
  nothingHere: 'Não há nada aqui.',
  copyThis: 'Copia isto:',
  copyCode: (code) => `Copiar ${code}`,
  supportLine: '☕ Estás a gostar do waypoints? É gratuito e será sempre.',
  supportOnKofi: 'Apoia no Ko-fi',
  newVersionReady: 'Está pronta uma nova versão do waypoints.',
  updateReady: (headline) => <>{headline} Recarrega quando acabares o que estás a fazer.</>,
  reload: 'Recarregar',
  later: 'Mais tarde',
  newInWaypoints: (version) => `✨ Novidades no waypoints ${version}`,
  dismiss: 'Dispensar',
  gotIt: 'Percebi',
  seeEarlier: (n) => `Ver ${plural(n, 'atualização anterior', 'atualizações anteriores')}`,
  allUpdates: 'Todas as atualizações',
  whatsNew: 'Novidades',
  save: 'Guardar',
  cancel: 'Cancelar',
  delete: 'Eliminar',
  edit: 'Editar',
  back: 'Voltar',
  add: 'Adicionar',
  done: 'Concluir',
  name: 'Nome',
  notes: 'Notas',
  link: 'Link',
  address: 'Morada',
  calendar: 'Calendário',
  booking: 'Reserva',
  website: 'Site',
  phone: 'Telefone',
  someone: 'Alguém',
  day: 'Dia',
  select: 'Selecionar',
  photos: 'Fotos',
}
