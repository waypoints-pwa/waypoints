import { useState } from 'react'
import { useNavigate } from 'react-router'
import { saveRecord, type Input } from '../../db/actions'
import type { TableRecords, TripTable } from '../../db/types'
import { tripPath, useTrip } from '../tripData'

/** Route segment of each kind of item: /trips/<id>/<segment>/<itemId>. */
export const SEGMENT: Record<Exclude<TripTable, 'travellers'>, string> = {
  stays: 'stays',
  transports: 'transport',
  activities: 'activities',
  places: 'places',
  expenses: 'expenses',
  exchanges: 'exchanges',
}

/**
 * Saves a form: a new item opens its page (replacing the form in history), an edited one goes back
 * to where it was opened from.
 */
export function useSave<T extends Exclude<TripTable, 'travellers'>>(table: T, existingId: string | undefined) {
  const t = useTrip()
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()
  const save = async (input: Input<TableRecords[T]>) => {
    setBusy(true)
    try {
      const id = await saveRecord(table, t.trip.id, input, existingId)
      if (existingId) navigate(-1)
      else navigate(tripPath(t.trip.id, SEGMENT[table], id), { replace: true })
    } catch {
      setError("Couldn't save. Try again.")
    } finally {
      setBusy(false)
    }
  }
  return { save, busy, error, setError }
}

/** Optional text: trimmed, and undefined when empty so the field is left out. */
export const opt = (value: string) => value.trim() || undefined
