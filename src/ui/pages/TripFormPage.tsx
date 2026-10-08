import { useState } from 'react'
import { useNavigate } from 'react-router'
import { createTrip, updateTrip, type TravellerDraft } from '../../db/actions'
import { setSetting, SETTINGS } from '../../db/db'
import { sharesOf } from '../../domain/expenses'
import { daysBetween, deviceTimeZone, isDay } from '../../domain/time'
import { BackLink } from '../components/bits'
import { CurrencySelect, Field, FormError, NotesField, TextField, ZoneSelect } from '../components/fields'
import { useSetting } from '../hooks'
import { TRIP_EMOJI } from '../labels'
import { tripPath, useOptionalTrip, type TripData } from '../tripData'

/** New trip (from the trip list) or editing one (inside a trip). */
export function TripFormPage() {
  const existing = useOptionalTrip()
  const myName = useSetting<string>(SETTINGS.myName)
  const lastCurrency = useSetting<string>(SETTINGS.lastCurrency)
  if (!myName || !lastCurrency) return null
  return <TripForm existing={existing ?? undefined} myName={myName.value} lastCurrency={lastCurrency.value} />
}

function TripForm({ existing, myName, lastCurrency }: { existing?: TripData; myName?: string; lastCurrency?: string }) {
  const navigate = useNavigate()
  const trip = existing?.trip
  const [name, setName] = useState(trip?.name ?? '')
  const [emoji, setEmoji] = useState(trip?.emoji ?? '')
  const [startDate, setStartDate] = useState(trip?.startDate ?? '')
  const [endDate, setEndDate] = useState(trip?.endDate ?? '')
  const [currency, setCurrency] = useState(trip?.currency ?? lastCurrency ?? 'EUR')
  const [timeZone, setTimeZone] = useState(trip?.timeZone ?? deviceTimeZone())
  const [notes, setNotes] = useState(trip?.notes ?? '')
  const [people, setPeople] = useState<TravellerDraft[]>(() =>
    existing ? existing.travellers.map((t) => ({ id: t.id, name: t.name })) : [{ name: myName ?? '' }, { name: '' }],
  )
  const [error, setError] = useState<string>()
  const [busy, setBusy] = useState(false)

  // Travellers with expenses can't be removed: their balances would be lost.
  const inExpenses = new Set(existing?.expenses.flatMap((e) => [e.paidBy, ...sharesOf(e).keys()]) ?? [])

  const setPerson = (index: number, value: string) => setPeople((list) => list.map((p, i) => (i === index ? { ...p, name: value } : p)))

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const travellers = people.map((p) => ({ ...p, name: p.name.trim() })).filter((p) => p.name)
    if (!name.trim()) return setError('Give the trip a name.')
    if (!isDay(startDate) || !isDay(endDate)) return setError('Choose when the trip starts and ends.')
    if (endDate < startDate) return setError('The trip ends before it starts.')
    if (daysBetween(startDate, endDate) > 365) return setError('A trip can be up to a year long.')
    if (!travellers.length) return setError(existing ? 'A trip needs at least one traveller.' : 'Add your name as the first traveller.')

    const input = { name: name.trim(), emoji: emoji || undefined, startDate, endDate, timeZone, currency, notes: notes.trim() || undefined }
    setBusy(true)
    try {
      if (trip) {
        await updateTrip(trip.id, input, travellers)
        navigate(tripPath(trip.id, 'trip'))
      } else {
        const id = await createTrip(
          input,
          travellers.map((t) => t.name),
        )
        if (!myName) await setSetting(SETTINGS.myName, travellers[0].name)
        navigate(tripPath(id), { replace: true })
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="form" onSubmit={(e) => void onSubmit(e)} noValidate>
      {trip ? <BackLink to={tripPath(trip.id, 'trip')}>Trip</BackLink> : <BackLink to="/">Your trips</BackLink>}
      <h2>{trip ? 'Edit trip' : 'New trip'}</h2>

      <TextField label="Name" value={name} onChange={setName} placeholder="Japan in spring" maxLength={200} autoFocus={!trip} />

      <div className="field" role="radiogroup" aria-label="Icon">
        <span>Icon</span>
        <div className="chips">
          {TRIP_EMOJI.map((e) => (
            <button key={e} type="button" role="radio" aria-checked={emoji === e} className="toggle-chip emoji-chip" onClick={() => setEmoji(emoji === e ? '' : e)}>
              {e}
            </button>
          ))}
        </div>
      </div>

      <div className="field-pair">
        <Field label="Starts">
          <input className="input" type="date" value={startDate} onChange={(e) => {
            setStartDate(e.target.value)
            if (!endDate || endDate < e.target.value) setEndDate(e.target.value)
          }} />
        </Field>
        <Field label="Ends">
          <input className="input" type="date" value={endDate} min={startDate || undefined} onChange={(e) => setEndDate(e.target.value)} />
        </Field>
      </div>

      <div className="field" role="group" aria-label="Who's going">
        <span>Who's going</span>
        {people.map((person, index) => {
          const isMe = existing ? existing.me?.id === person.id && Boolean(person.id) : index === 0
          const locked = Boolean(person.id && inExpenses.has(person.id))
          return (
            <div key={person.id ?? `new-${index}`} className="traveller-row">
              <input
                className="input"
                value={person.name}
                maxLength={60}
                placeholder={index === 0 && !existing ? 'Your name' : 'Name'}
                aria-label={isMe ? 'Your name' : `Traveller ${index + 1}`}
                onChange={(e) => setPerson(index, e.target.value)}
              />
              {isMe && <span className="chip">you</span>}
              <button
                type="button"
                className="icon-btn"
                disabled={locked || people.length === 1}
                title={locked ? 'Has expenses, so can’t be removed' : 'Remove'}
                aria-label={`Remove ${person.name || 'traveller'}`}
                onClick={() => setPeople((list) => list.filter((_, i) => i !== index))}
              >
                ✕
              </button>
            </div>
          )
        })}
        <button type="button" className="btn btn-small" style={{ alignSelf: 'flex-start' }} onClick={() => setPeople((list) => [...list, { name: '' }])}>
          + Add someone
        </button>
        <small className="muted">Just you? That's fine: leave the others empty. Expenses are split between the people here.</small>
      </div>

      <Field label="Currency" hint="Totals and balances are shown in it. Expenses can be in any currency.">
        <CurrencySelect value={currency} onChange={setCurrency} suggestions={[currency]} label="Currency" />
      </Field>
      {trip && currency !== trip.currency && existing.expenses.length > 0 && (
        <p className="notice notice-warn small">
          Expenses and exchanges so far were counted in {trip.currency}. After the change, expenses in {trip.currency} need an
          exchange rate to {currency} (Money → Exchange rates) before they're counted again.
        </p>
      )}

      <Field label="Time zone" hint="Where the trip happens. Each booking can have its own (for flights, say).">
        <ZoneSelect value={timeZone} onChange={setTimeZone} suggestions={[...new Set([timeZone, deviceTimeZone(), ...(existing?.zones ?? [])])]} label="Time zone" />
      </Field>

      <NotesField value={notes} onChange={setNotes} placeholder="Anything useful for everyone: emergency numbers, plans, ideas…" />

      <FormError error={error} />
      <div className="form-actions">
        <button type="button" className="btn btn-ghost" onClick={() => navigate(trip ? tripPath(trip.id, 'trip') : '/')}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {trip ? 'Save' : 'Create trip'}
        </button>
      </div>
    </form>
  )
}
