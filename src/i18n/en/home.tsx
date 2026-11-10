import type { ReactNode } from 'react'

export const home = {
  yourTrips: 'Your trips',
  newTrip: '+ New trip',
  groupNow: 'Now',
  groupComingUp: 'Coming up',
  groupPast: 'Past trips',
  openTripLinkOrFile: '🔗 Open a trip link or file',
  tomorrow: 'Tomorrow',
  inDays: (n: number) => `In ${n} days`,
  dayOf: (day: number, length: number) => `Day ${day} of ${length}`,
  done: 'Done',
  onTheServer: ' · 🌐 on the server',
  planATrip: 'Plan a trip',
  welcomeText:
    'Keep your bookings, a day-by-day plan, places to see and shared expenses in one place. It works offline, with no account, and you can share a trip with the people going.',
  openTripSentToYou: '🔗 Open a trip someone sent you',
  newHere: (guide: ReactNode) => <>New here? {guide}</>,
  readTheGuide: 'Read the guide',
}
