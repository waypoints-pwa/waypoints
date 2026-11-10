import { m } from '../i18n'
import type { ExpenseCategory, PlaceCategory, StayKind, TransportMode } from '../db/types'

export interface Label {
  label: string
  emoji: string
}

type Labels<K extends string> = Record<K, Label>

export const STAY_KINDS: Labels<StayKind> = {
  hotel: { label: m.labels.stay.hotel, emoji: '🏨' },
  apartment: { label: m.labels.stay.apartment, emoji: '🏢' },
  hostel: { label: m.labels.stay.hostel, emoji: '🛏️' },
  house: { label: m.labels.stay.house, emoji: '🏡' },
  camping: { label: m.labels.stay.camping, emoji: '⛺' },
  other: { label: m.labels.stay.other, emoji: '🛌' },
}

export const TRANSPORT_MODES: Labels<TransportMode> = {
  flight: { label: m.labels.transport.flight, emoji: '✈️' },
  train: { label: m.labels.transport.train, emoji: '🚆' },
  bus: { label: m.labels.transport.bus, emoji: '🚌' },
  car: { label: m.labels.transport.car, emoji: '🚗' },
  ferry: { label: m.labels.transport.ferry, emoji: '⛴️' },
  other: { label: m.labels.transport.other, emoji: '🧭' },
}

export const PLACE_CATEGORIES: Labels<PlaceCategory> = {
  sight: { label: m.labels.place.sight, emoji: '🏛️' },
  museum: { label: m.labels.place.museum, emoji: '🖼️' },
  nature: { label: m.labels.place.nature, emoji: '🌳' },
  food: { label: m.labels.place.food, emoji: '🍽️' },
  drinks: { label: m.labels.place.drinks, emoji: '☕' },
  shopping: { label: m.labels.place.shopping, emoji: '🛍️' },
  other: { label: m.labels.place.other, emoji: '📍' },
}

export const EXPENSE_CATEGORIES: Labels<ExpenseCategory> = {
  food: { label: m.labels.expense.food, emoji: '🍽️' },
  groceries: { label: m.labels.expense.groceries, emoji: '🛒' },
  transport: { label: m.labels.expense.transport, emoji: '🚕' },
  stay: { label: m.labels.expense.stay, emoji: '🏨' },
  activities: { label: m.labels.expense.activities, emoji: '🎟️' },
  shopping: { label: m.labels.expense.shopping, emoji: '🛍️' },
  other: { label: m.labels.expense.other, emoji: '💸' },
}

/** The title a settle-up payment is saved with (stored text in the shared trip, never translated). */
export const PAYMENT_TITLE = 'Payment'

/** An expense's title as shown: a payment saved as "Payment" shows the app's word for it. */
export const expenseTitle = (e: { title: string; transfer?: boolean }) => (e.transfer && e.title === PAYMENT_TITLE ? m.money.payment : e.title)

/** A kind or category, falling back to "other" for one from a newer version of the app. */
export const labelOf = <K extends string>(labels: Labels<K>, key: string): Label => labels[key as K] ?? labels['other' as K]

export const TRIP_EMOJI = ['✈️', '🏖️', '🏔️', '🏙️', '🚆', '🚗', '⛺', '🎒', '🗺️', '🌍']
