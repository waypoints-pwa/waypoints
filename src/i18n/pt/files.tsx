import type { Messages } from '../en'
import { plural } from '../plural'

export const files: Messages['files'] = {
  groups: {
    trip: 'Toda a viagem',
    stays: 'Estadias',
    transports: 'Trajetos',
    activities: 'Atividades',
    places: 'Locais',
    expenses: 'Despesas',
  },
  onlyOnThisPhoneState: '🔒 Só neste telemóvel',
  waitingToGoUp: '⏳ À espera de seguir para o servidor',
  serverDidntTakeIt: '⚠️ O servidor não o aceitou',
  sharedWithTrip: '🌐 Partilhado com a viagem',
  onServer: '🌐 No servidor',
  notOnServerYet: (name) =>
    name ? `⏳ Ainda não está no servidor: o telemóvel de ${name} ainda não o enviou` : '⏳ Ainda não está no servidor: o telemóvel ainda não o enviou',
  notOnThisPhone: '📱 Não está neste telemóvel',
  oldServer: '⚠️ O servidor de sincronização é demasiado antigo para fotos e documentos: precisa de ser atualizado',
  nSelected: (n) => `${n} ${n === 1 ? 'selecionado' : 'selecionados'}`,
  selectAll: 'Selecionar tudo',
  deleteSome: {
    photo: (n) => `Eliminar ${plural(n, 'foto', 'fotos')}?`,
    document: (n) => `Eliminar ${plural(n, 'documento', 'documentos')}?`,
  },
  wholeBookingGoes: 'Os de uma reserva completa saem de todos os trajetos dessa reserva.',
  deletedForEveryone: 'Serão eliminados para todos na viagem.',
  belongsTo: 'Pertence a',
  wholeTrip: 'Toda a viagem',
  shareBooking: {
    flight: 'Voos com ligação? Dá a todos a mesma referência da reserva e um documento pode aparecer em cada um.',
    journey: 'Comprados com outros trajetos? Dá a todos a mesma referência da reserva e um documento pode aparecer em cada um.',
  },
  forEvery: {
    flight: (ref) => `Para todos os voos da reserva ${ref}`,
    journey: (ref) => `Para todos os trajetos da reserva ${ref}`,
  },
  alsoShowsOn: (titles) => `Também aparece em ${titles}.`,
  addPhotos: '📷 Adicionar fotos',
  addDocuments: '📄 Adicionar documentos',
  adding: 'A adicionar…',
  addingOf: (i, n) => `A adicionar ${i} de ${n}…`,
  tooLarge: (name, limit) =>
    `${name} é maior do que o servidor de sincronização aceita (${limit}). Guarda-o só neste telemóvel ou reduz o tamanho.`,
  couldntBeAdded: (name) => `Não foi possível adicionar ${name}.`,
  added: {
    photo: (n) => `${n === 1 ? 'Adicionada' : 'Adicionadas'} ${plural(n, 'foto', 'fotos')}.`,
    document: (n) => `${n === 1 ? 'Adicionado' : 'Adicionados'} ${plural(n, 'documento', 'documentos')}.`,
  },
  addSome: {
    photo: (n) => `Adicionar ${plural(n, 'foto', 'fotos')}`,
    document: (n) => `Adicionar ${plural(n, 'documento', 'documentos')}`,
  },
  caption: 'Legenda',
  optional: 'Opcional',
  onlyOnThisPhone: 'Só neste telemóvel',
  notSentToServer: 'Não é enviado para o servidor, por isso os outros não o veem: para um passaporte, por exemplo.',
  staysHere: 'Fica aqui mesmo que a viagem passe para o servidor de sincronização mais tarde: para um passaporte, por exemplo.',
  photosAndDocuments: 'Fotos e documentos',
}
