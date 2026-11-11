import type { Messages } from '../en'

export const calendar: Messages['calendar'] = {
  seat: (seat) => `Lugar ${seat}`,
  booking: (ref) => `Reserva: ${ref}`,
  checkInFrom: (time) => `Check-in a partir das ${time}`,
  checkOutBy: (time) => `Check-out até às ${time}`,
  phone: (phone) => `Telefone: ${phone}`,
}
