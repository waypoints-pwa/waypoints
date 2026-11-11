export const calendar = {
  seat: (seat: string): string => `Seat ${seat}`,
  booking: (ref: string): string => `Booking: ${ref}`,
  checkInFrom: (time: string): string => `Check-in from ${time}`,
  checkOutBy: (time: string): string => `Check-out by ${time}`,
  phone: (phone: string): string => `Phone: ${phone}`,
}
