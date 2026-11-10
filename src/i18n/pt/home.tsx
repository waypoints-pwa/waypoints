import type { Messages } from '../en'

export const home: Messages['home'] = {
  yourTrips: 'As tuas viagens',
  newTrip: '+ Nova viagem',
  groupNow: 'Agora',
  groupComingUp: 'Em breve',
  groupPast: 'Viagens passadas',
  openTripLinkOrFile: '🔗 Abrir um link ou ficheiro de viagem',
  tomorrow: 'Amanhã',
  inDays: (n) => `Daqui a ${n} dias`,
  dayOf: (day, length) => `Dia ${day} de ${length}`,
  done: 'Concluída',
  onTheServer: ' · 🌐 no servidor',
  planATrip: 'Planear uma viagem',
  welcomeText:
    'Guarda as tuas reservas, um plano dia a dia, locais para visitar e despesas partilhadas num só sítio. Funciona offline, sem conta, e podes partilhar uma viagem com quem vai contigo.',
  openTripSentToYou: '🔗 Abrir uma viagem que alguém te enviou',
  newHere: (guide) => <>Novo por aqui? {guide}</>,
  readTheGuide: 'Ler o guia',
}
