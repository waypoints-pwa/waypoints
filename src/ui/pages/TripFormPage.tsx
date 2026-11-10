import { useState } from 'react'
import { useNavigate } from 'react-router'
import { createTrip, updateTrip, type TravellerDraft } from '../../db/actions'
import { setSetting, SETTINGS } from '../../db/db'
import type { ServerConfig } from '../../db/serverState'
import { sharesOf } from '../../domain/expenses'
import type { MemberSummary } from '../../domain/serverProtocol'
import { daysBetween, deviceTimeZone, isDay } from '../../domain/time'
import { m } from '../../i18n'
import { BackLink } from '../components/bits'
import { CurrencySelect, Field, FormError, NotesField, TextField, ZoneSelect } from '../components/fields'
import { usable, useServer, useSetting } from '../hooks'
import { TRIP_EMOJI } from '../labels'
import { tripPath, useOptionalTrip, type TripData } from '../tripData'

/** Creating a trip (from the trip list) or editing one (inside a trip). */
export function TripFormPage() {
  const existing = useOptionalTrip()
  const myName = useSetting<string>(SETTINGS.myName)
  const lastCurrency = useSetting<string>(SETTINGS.lastCurrency)
  const server = useServer()
  if (!myName || !lastCurrency || server === undefined) return null
  return <TripForm existing={existing ?? undefined} myName={myName.value} lastCurrency={lastCurrency.value} server={usable(server)} />
}

/** Everyone on the server, this phone's member included even before the first sync lists them. */
const membersOf = (server: ServerConfig): MemberSummary[] =>
  server.members.some((x) => x.id === server.member.id) ? server.members : [server.member, ...server.members]

function TripForm(props: { existing?: TripData; myName?: string; lastCurrency?: string; server?: ServerConfig }) {
  const { existing, myName, lastCurrency, server } = props
  const navigate = useNavigate()
  const trip = existing?.trip
  const [name, setName] = useState(trip?.name ?? '')
  const [emoji, setEmoji] = useState(trip?.emoji ?? '')
  const [startDate, setStartDate] = useState(trip?.startDate ?? '')
  const [endDate, setEndDate] = useState(trip?.endDate ?? '')
  const [currency, setCurrency] = useState(trip?.currency ?? lastCurrency ?? 'EUR')
  const [timeZone, setTimeZone] = useState(trip?.timeZone ?? deviceTimeZone())
  const [notes, setNotes] = useState(trip?.notes ?? '')
  // A new trip goes on the server when there is one; an existing one is moved there from the Trip tab.
  const [onServer, setOnServer] = useState(existing ? Boolean(existing.server) : Boolean(server))
  const [people, setPeople] = useState<TravellerDraft[]>(() =>
    existing
      ? existing.travellers.map((t) => ({ id: t.id, name: t.name, memberId: t.memberId }))
      : server
        ? [{ name: server.member.name, memberId: server.member.id }]
        : [{ name: myName ?? '' }, { name: '' }],
  )
  const linking = onServer && server ? server : undefined
  const members = linking ? membersOf(linking) : []
  const linked = new Set(people.map((p) => p.memberId).filter(Boolean))
  const [error, setError] = useState<string>()
  const [busy, setBusy] = useState(false)

  // Travellers with expenses can't be removed: their balances would be lost.
  const inExpenses = new Set(existing?.expenses.flatMap((e) => [e.paidBy, ...sharesOf(e).keys()]) ?? [])

  const setPerson = (index: number, value: string) => setPeople((list) => list.map((p, i) => (i === index ? { ...p, name: value } : p)))
  const setLink = (index: number, memberId: string) =>
    setPeople((list) =>
      list.map((p, i) => {
        if (i !== index) return p
        const member = members.find((x) => x.id === memberId)
        return { ...p, memberId: member?.id, name: p.name.trim() || member?.name || '' }
      }),
    )
  const addPerson = (person: TravellerDraft) => setPeople((list) => [...list.filter((p) => p.name.trim() || p.id), person])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const travellers = people
      .map((p) => ({ ...p, name: p.name.trim(), memberId: linking || existing ? p.memberId : undefined }))
      .filter((p) => p.name)
    if (!name.trim()) return setError(m.trip.errorName)
    if (!isDay(startDate) || !isDay(endDate)) return setError(m.trip.errorDates)
    if (endDate < startDate) return setError(m.trip.errorEndsBeforeStart)
    if (daysBetween(startDate, endDate) > 365) return setError(m.trip.errorTooLong)
    if (!travellers.length) return setError(existing ? m.trip.errorNoTravellerEdit : m.trip.errorNoTravellerNew)
    if (linking && !travellers.some((p) => p.memberId === linking.member.id)) {
      return setError(
        existing
          ? m.trip.errorTakeSelfOff
          : m.trip.errorChooseWhichYou,
      )
    }

    const input = { name: name.trim(), emoji: emoji || undefined, startDate, endDate, timeZone, currency, notes: notes.trim() || undefined }
    setBusy(true)
    try {
      if (trip) {
        await updateTrip(trip.id, input, travellers)
        navigate(tripPath(trip.id, 'trip'))
      } else {
        // You come first: the first traveller is the one using this phone.
        const mine = linking ? travellers.findIndex((p) => p.memberId === linking.member.id) : 0
        const ordered = [travellers[mine], ...travellers.filter((_, i) => i !== mine)]
        const id = await createTrip(input, ordered, { onServer: Boolean(linking) })
        if (!myName) await setSetting(SETTINGS.myName, travellers[0].name)
        navigate(tripPath(id), { replace: true })
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="form" onSubmit={(e) => void onSubmit(e)} noValidate>
      {!trip && <BackLink to="/">{m.common.yourTrips}</BackLink>}
      <h2>{trip ? m.trip.editTrip : m.trip.newTrip}</h2>

      <TextField label={m.common.name} value={name} onChange={setName} placeholder={m.trip.namePlaceholder} maxLength={200} autoFocus={!trip} />

      <div className="field" role="radiogroup" aria-label={m.trip.icon}>
        <span>{m.trip.icon}</span>
        <div className="chips">
          {TRIP_EMOJI.map((e) => (
            <button key={e} type="button" role="radio" aria-checked={emoji === e} className="toggle-chip emoji-chip" onClick={() => setEmoji(emoji === e ? '' : e)}>
              {e}
            </button>
          ))}
        </div>
      </div>

      <div className="field-pair">
        <Field label={m.trip.starts}>
          <input className="input" type="date" value={startDate} onChange={(e) => {
            setStartDate(e.target.value)
            if (!endDate || endDate < e.target.value) setEndDate(e.target.value)
          }} />
        </Field>
        <Field label={m.trip.ends}>
          <input className="input" type="date" value={endDate} min={startDate || undefined} onChange={(e) => setEndDate(e.target.value)} />
        </Field>
      </div>

      {!existing && server && (
        <div className="field" role="group" aria-label={m.trip.whereKept}>
          <span>{m.trip.whereKept}</span>
          <div className="segmented">
            <button type="button" className={onServer ? 'active' : ''} aria-pressed={onServer} onClick={() => setOnServer(true)}>
              {m.trip.onTheServer}
            </button>
            <button type="button" className={onServer ? '' : 'active'} aria-pressed={!onServer} onClick={() => setOnServer(false)}>
              {m.trip.onlyOnThisPhone}
            </button>
          </div>
          <small className="muted">
            {onServer
              ? m.trip.keptOnServerHint
              : m.trip.keptOnPhoneHint}
          </small>
        </div>
      )}

      <div className="field" role="group" aria-label={m.trip.whosGoing}>
        <span>{m.trip.whosGoing}</span>
        {people.map((person, index) => {
          const isMe = linking ? person.memberId === linking.member.id : existing ? existing.me?.id === person.id && Boolean(person.id) : index === 0
          const locked = Boolean(person.id && inExpenses.has(person.id))
          return (
            <div key={person.id ?? `new-${index}`} className="traveller">
              <div className="traveller-row">
                <input
                  className="input"
                  value={person.name}
                  maxLength={60}
                  placeholder={index === 0 && !existing ? m.trip.yourName : m.common.name}
                  aria-label={isMe ? m.trip.yourName : m.trip.travellerN(index + 1)}
                  onChange={(e) => setPerson(index, e.target.value)}
                />
                {isMe && <span className="chip">{m.trip.you}</span>}
                <button
                  type="button"
                  className="icon-btn"
                  disabled={locked || people.length === 1}
                  title={locked ? m.trip.hasExpenses : m.trip.remove}
                  aria-label={m.trip.removePerson(person.name || m.trip.travellerLower)}
                  onClick={() => setPeople((list) => list.filter((_, i) => i !== index))}
                >
                  ✕
                </button>
              </div>
              {linking && (
                <select
                  className="input input-link"
                  value={person.memberId ?? ''}
                  aria-label={m.trip.onTheServerLabel(person.name || m.trip.traveller)}
                  onChange={(e) => setLink(index, e.target.value)}
                >
                  <option value="">{m.trip.notOnServerGetsLinks}</option>
                  {members
                    .filter((x) => x.id === person.memberId || !linked.has(x.id))
                    .map((x) => (
                      <option key={x.id} value={x.id}>
                        {m.trip.memberOnServer(x.name)}
                      </option>
                    ))}
                </select>
              )}
            </div>
          )
        })}
        {linking && members.some((x) => !linked.has(x.id)) && (
          <div className="chips" role="group" aria-label={m.trip.addFromServer}>
            {members
              .filter((x) => !linked.has(x.id))
              .map((x) => (
                <button key={x.id} type="button" className="toggle-chip" onClick={() => addPerson({ name: x.name, memberId: x.id })}>
                  + 🌐 {x.name}
                </button>
              ))}
          </div>
        )}
        <button type="button" className="btn btn-small" style={{ alignSelf: 'flex-start' }} onClick={() => setPeople((list) => [...list, { name: '' }])}>
          {linking ? m.trip.addSomeoneNotOnServer : m.trip.addSomeone}
        </button>
        <small className="muted">
          {linking
            ? m.trip.peopleHintServer
            : m.trip.peopleHintPhone}
        </small>
      </div>

      <Field label={m.trip.currency} hint={m.trip.currencyHint}>
        <CurrencySelect value={currency} onChange={setCurrency} suggestions={[currency]} label={m.trip.currency} />
      </Field>
      {trip && currency !== trip.currency && existing.expenses.length > 0 && (
        <p className="notice notice-warn small">
          {m.trip.currencyChangeWarning(trip.currency, currency)}
        </p>
      )}

      <Field label={m.trip.timeZone} hint={m.trip.timeZoneHint}>
        <ZoneSelect value={timeZone} onChange={setTimeZone} suggestions={[...new Set([timeZone, deviceTimeZone(), ...(existing?.zones ?? [])])]} label={m.trip.timeZone} />
      </Field>

      <NotesField value={notes} onChange={setNotes} placeholder={m.trip.notesPlaceholder} />

      <FormError error={error} />
      <div className="form-actions">
        <button type="button" className="btn btn-ghost" onClick={() => navigate(trip ? tripPath(trip.id, 'trip') : '/')}>
          {m.common.cancel}
        </button>
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {trip ? m.common.save : m.trip.createTrip}
        </button>
      </div>
    </form>
  )
}
