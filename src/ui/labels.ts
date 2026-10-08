import type { ExpenseCategory, PlaceCategory, StayKind, TransportMode } from '../db/types'

export interface Label {
  label: string
  emoji: string
}

type Labels<K extends string> = Record<K, Label>

export const STAY_KINDS: Labels<StayKind> = {
  hotel: { label: 'Hotel', emoji: '🏨' },
  apartment: { label: 'Apartment', emoji: '🏢' },
  hostel: { label: 'Hostel', emoji: '🛏️' },
  house: { label: 'House', emoji: '🏡' },
  camping: { label: 'Camping', emoji: '⛺' },
  other: { label: 'Other', emoji: '🛌' },
}

export const TRANSPORT_MODES: Labels<TransportMode> = {
  flight: { label: 'Flight', emoji: '✈️' },
  train: { label: 'Train', emoji: '🚆' },
  bus: { label: 'Bus', emoji: '🚌' },
  car: { label: 'Car', emoji: '🚗' },
  ferry: { label: 'Ferry', emoji: '⛴️' },
  other: { label: 'Other', emoji: '🧭' },
}

export const PLACE_CATEGORIES: Labels<PlaceCategory> = {
  sight: { label: 'Sights', emoji: '🏛️' },
  museum: { label: 'Museums', emoji: '🖼️' },
  nature: { label: 'Nature', emoji: '🌳' },
  food: { label: 'Food', emoji: '🍽️' },
  drinks: { label: 'Bars & cafés', emoji: '☕' },
  shopping: { label: 'Shopping', emoji: '🛍️' },
  other: { label: 'Other', emoji: '📍' },
}

export const EXPENSE_CATEGORIES: Labels<ExpenseCategory> = {
  food: { label: 'Food & drinks', emoji: '🍽️' },
  groceries: { label: 'Groceries', emoji: '🛒' },
  transport: { label: 'Transport', emoji: '🚕' },
  stay: { label: 'Accommodation', emoji: '🏨' },
  activities: { label: 'Activities', emoji: '🎟️' },
  shopping: { label: 'Shopping', emoji: '🛍️' },
  other: { label: 'Other', emoji: '💸' },
}

/** A kind or category, falling back to "other" for one from a newer version of the app. */
export const labelOf = <K extends string>(labels: Labels<K>, key: string): Label => labels[key as K] ?? labels['other' as K]

export const TRIP_EMOJI = ['✈️', '🏖️', '🏔️', '🏙️', '🚆', '🚗', '⛺', '🎒', '🗺️', '🌍']
