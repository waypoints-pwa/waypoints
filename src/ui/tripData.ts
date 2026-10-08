import { createContext, useContext } from 'react'
import { db, getSetting, isLive, recordTable, SETTINGS } from '../db/db'
import type { Activity, Exchange, Expense, Place, Stay, Transport, Traveller, Trip, TripTable } from '../db/types'
import { rateFinder, type RateOf } from '../domain/expenses'

/** Everything in one trip that's still live, loaded once for all the trip's pages. */
export interface TripData {
  trip: Trip
  travellers: Traveller[]
  stays: Stay[]
  transports: Transport[]
  activities: Activity[]
  places: Place[]
  expenses: Expense[]
  exchanges: Exchange[]
  /** Converts an expense to the trip's currency: its own rate, else what the exchanges got. */
  rateOf: RateOf
  /** The traveller using this phone, if they've said which one they are. */
  me?: Traveller
  /** Changes made here that the group hasn't had in a link yet. */
  unsent: number
  /** Every traveller ever on the trip, removed ones too: old expenses may still name them. */
  names: Map<string, string>
  /** Cities used anywhere in the trip, for suggestions. */
  cities: string[]
  /** Time zones used in the trip, the trip's own first. */
  zones: string[]
}

const byCreation = (a: { createdAt: string; id: string }, b: { createdAt: string; id: string }) =>
  a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id)

export async function loadTrip(tripId: string): Promise<TripData | null> {
  const trip = await db.trips.get(tripId)
  if (!trip || trip.deletedAt) return null
  const ofTrip = <T extends TripTable>(table: T) => recordTable(table).where('tripId').equals(tripId).toArray()
  const [allTravellers, stays, transports, activities, places, expenses, exchanges, meId, unsent] = await Promise.all([
    ofTrip('travellers'),
    ofTrip('stays'),
    ofTrip('transports'),
    ofTrip('activities'),
    ofTrip('places'),
    ofTrip('expenses'),
    ofTrip('exchanges'),
    getSetting<string>(SETTINGS.me(tripId)),
    db.unsent.where('tripId').equals(tripId).count(),
  ])
  const travellers = allTravellers.filter(isLive).sort(byCreation)
  const data = {
    stays: stays.filter(isLive),
    transports: transports.filter(isLive),
    activities: activities.filter(isLive),
    places: places.filter(isLive),
    expenses: expenses.filter(isLive),
    exchanges: exchanges.filter(isLive),
  }
  const cities = [...data.stays, ...data.activities, ...data.places].map((r) => r.city?.trim()).filter((c): c is string => Boolean(c))
  const zones = [
    trip.timeZone,
    ...data.stays.map((s) => s.timeZone),
    ...data.transports.flatMap((t) => [t.departTimeZone, t.arriveTimeZone]),
    ...data.activities.map((a) => a.timeZone),
  ].filter((z): z is string => Boolean(z))
  return {
    trip,
    travellers,
    ...data,
    rateOf: rateFinder(trip.currency, data.exchanges),
    me: travellers.find((t) => t.id === meId),
    unsent,
    names: new Map(allTravellers.map((t) => [t.id, t.name])),
    cities: [...new Set(cities)].sort((a, b) => a.localeCompare(b)),
    zones: [...new Set(zones)],
  }
}

export const TripContext = createContext<TripData | null>(null)

export function useTrip(): TripData {
  const data = useContext(TripContext)
  if (!data) throw new Error('useTrip() outside a trip')
  return data
}

/** The trip when inside one, null elsewhere (the trip form is used for both). */
export const useOptionalTrip = () => useContext(TripContext)

/** Absolute path inside a trip: tripPath(id, 'stays', stayId). */
export const tripPath = (tripId: string, ...parts: string[]) => ['/trips', tripId, ...parts].filter(Boolean).join('/')

export const nameOf = (t: TripData, travellerId: string) => t.names.get(travellerId) ?? 'Someone'
