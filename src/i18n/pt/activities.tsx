import type { Messages } from '../en'

export const activities: Messages['activities'] = {
  newTitle: 'Nova atividade',
  editTitle: 'Editar atividade',
  whatAreYouDoing: 'O que vais fazer?',
  chooseDay: 'Escolhe um dia.',
  endsBeforeStarts: 'Termina antes de começar.',
  what: 'O quê',
  whatPlaceholder: 'Espetáculo de fado, aula de culinária, excursão a Sintra…',
  when: 'Quando',
  whenHint: 'Deixa a hora vazia para planos de dia inteiro.',
  endsAt: 'Termina às',
  addressOrMeetingPoint: 'Morada ou ponto de encontro',
  bookingReference: 'Referência da reserva',
  linkPlaceholder: 'Bilhetes, o site do local…',
  allDay: '(dia inteiro)',
  place: 'Local',
  timesAre: (city) => `As horas são de ${city}.`,
  where: 'Onde',
}
