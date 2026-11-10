import type { Messages } from '../en'
import { plural } from '../plural'

export const stays: Messages['stays'] = {
  newTitle: 'Nova estadia',
  editTitle: 'Editar estadia',
  giveName: 'Dá um nome à estadia.',
  chooseDays: 'Escolhe os dias de check-in e de check-out.',
  checkOutBeforeCheckIn: 'O check-out é antes do check-in.',
  namePlaceholder: 'Hotel Sol, Casa da Ana…',
  type: 'Tipo',
  checkIn: 'Check-in',
  checkOut: 'Check-out',
  bookingReference: 'Referência da reserva',
  linkPlaceholder: 'A página da reserva ou do anúncio',
  notesPlaceholder: 'Código da porta, Wi-Fi, como receber as chaves…',
  stay: 'Estadia',
  nights: (n) => plural(n, 'noite', 'noites'),
  timesAre: (city) => `As horas são de ${city}.`,
  bookingPage: 'Página da reserva',
}
