import type { Messages } from '../en'

export const fields: Messages['fields'] = {
  dateOf: (label) => `${label}: data`,
  timeOptional: (label) => `${label}: hora (opcional)`,
  usedInTrip: 'Usados nesta viagem',
  allTimeZones: 'Todos os fusos horários',
  timesLocalTo: 'As horas são locais em',
  changeTimeZone: 'Alterar fuso horário',
  thisTrip: 'Esta viagem',
  allCurrencies: 'Todas as moedas',
  city: 'Cidade',
  airport: 'Aeroporto',
  inThisTrip: 'Nesta viagem',
  cities: 'Cidades',
  airports: 'Aeroportos',
  turnOnInSettings: 'Para pesquisar moradas online, ativa isso nas Definições.',
  searching: 'A pesquisar…',
  searchFailed: 'Não foi possível pesquisar online. Sem internet?',
  foundByPhoton: 'Encontrado pelo Photon · © OpenStreetMap contributors',
  foundOnline: 'Encontrados online',
}
