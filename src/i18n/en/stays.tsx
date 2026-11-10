import { plural } from '../plural'

export const stays = {
  newTitle: 'New stay',
  editTitle: 'Edit stay',
  giveName: 'Give the stay a name.',
  chooseDays: 'Choose the check-in and check-out days.',
  checkOutBeforeCheckIn: 'Check-out is before check-in.',
  namePlaceholder: 'Hotel Sol, Casa da Ana…',
  type: 'Type',
  checkIn: 'Check-in',
  checkOut: 'Check-out',
  bookingReference: 'Booking reference',
  linkPlaceholder: 'The booking or listing page',
  notesPlaceholder: 'Door code, Wi-Fi, how to get the keys…',
  stay: 'Stay',
  nights: (n: number): string => plural(n, 'night'),
  timesAre: (city: string): string => `Times are ${city} time.`,
  bookingPage: 'Booking page',
}
