import { useState } from 'react'
import { useParams, useSearchParams } from 'react-router'
import { m } from '../../i18n'
import type { Transport, TransportMode } from '../../db/types'
import { connections } from '../../domain/bookings'
import { transportEvent } from '../../domain/calendar'
import { transportDuration, tripPhase } from '../../domain/itinerary'
import { mapQuery } from '../../domain/links'
import { airportCode } from '../../domain/places'
import { isDay, zoneCity, zonedInstant } from '../../domain/time'
import { CopyCode, DetailHead } from '../components/bits'
import { ConnectionCard } from '../components/ConnectionCard'
import { ChoiceChips, DateTimeField, NotesField, TextField, ZoneField } from '../components/fields'
import { AirportField, CityField } from '../components/PlaceFields'
import { CalendarLinks, MapLinks, WebLink } from '../components/ItemLinks'
import { fmtDayTime, fmtDuration } from '../format'
import { labelOf, TRANSPORT_MODES } from '../labels'
import { useToday } from '../hooks'
import { tripPath, useTrip } from '../tripData'
import { AttachmentsCard } from '../components/Attachments'
import { ReviewsCard } from '../components/Reviews'
import { ItemFooter, ItemForm, ItemGone } from './common'
import { opt, useSave } from './save'
import { useItemZone } from './zone'

export function TransportFormPage() {
  const t = useTrip()
  const { itemId } = useParams()
  const [params] = useSearchParams()
  const existing = itemId ? t.transports.find((r) => r.id === itemId) : undefined
  if (itemId && !existing) return <ItemGone backTo={tripPath(t.trip.id)} />
  return <TransportForm key={itemId ?? 'new'} existing={existing} date={params.get('date')} />
}

function TransportForm({ existing, date }: { existing?: Transport; date: string | null }) {
  const t = useTrip()
  const { trip } = t
  const today = useToday()
  const firstDay = date && isDay(date) ? date : tripPhase(trip, today).phase === 'ongoing' ? today : trip.startDate
  const [mode, setMode] = useState<string>(existing?.mode ?? 'flight')
  const [from, setFrom] = useState(existing?.from ?? '')
  const [to, setTo] = useState(existing?.to ?? '')
  const [departDate, setDepartDate] = useState(existing?.departDate ?? firstDay)
  const [departTime, setDepartTime] = useState(existing?.departTime ?? '')
  const [departTimeZone, setDepartTimeZone] = useItemZone(existing?.departTimeZone, departDate)
  const [arriveDate, setArriveDate] = useState(existing?.arriveDate ?? '')
  const [arriveTime, setArriveTime] = useState(existing?.arriveTime ?? '')
  const [arriveTimeZone, setArriveTimeZone] = useState(existing?.arriveTimeZone ?? '')
  const [carrier, setCarrier] = useState(existing?.carrier ?? '')
  const [number, setNumber] = useState(existing?.number ?? '')
  const [seat, setSeat] = useState(existing?.seat ?? '')
  const [confirmation, setConfirmation] = useState(existing?.confirmation ?? '')
  const [link, setLink] = useState(existing?.link ?? '')
  const [notes, setNotes] = useState(existing?.notes ?? '')
  const { save, busy, error, setError } = useSave('transports', existing?.id)
  const flight = mode === 'flight'
  // Picking an airport or a city sets the time zone its times are in.
  const PlaceField = flight ? AirportField : CityField

  const onSubmit = () => {
    if (!from.trim() || !to.trim()) return setError(m.journeys.fillInPlaces)
    if (!isDay(departDate)) return setError(m.journeys.chooseDay)
    if (arriveDate && !isDay(arriveDate)) return setError(m.journeys.checkArrivalDay)
    const arrivalZone = arriveTimeZone && arriveTimeZone !== departTimeZone ? arriveTimeZone : undefined
    if (arriveDate && arriveDate < departDate) return setError(m.journeys.arrivalBeforeDeparture)
    if (departTime && arriveTime) {
      const leaves = zonedInstant(departDate, departTime, departTimeZone)
      const arrives = zonedInstant(arriveDate || departDate, arriveTime, arrivalZone ?? departTimeZone)
      if (arrives <= leaves) return setError(m.journeys.arrivalBeforeDepartureZone)
    }
    void save({
      mode: mode as TransportMode,
      from: from.trim(),
      to: to.trim(),
      departDate,
      departTime: departTime || undefined,
      departTimeZone,
      arriveDate: arriveDate && arriveDate !== departDate ? arriveDate : undefined,
      arriveTime: arriveTime || undefined,
      arriveTimeZone: arrivalZone,
      carrier: opt(carrier),
      number: opt(number),
      seat: opt(seat),
      confirmation: opt(confirmation),
      link: opt(link),
      notes: opt(notes),
    })
  }

  return (
    <ItemForm title={existing ? m.journeys.editTitle : m.journeys.newTitle} error={error} busy={busy} onSubmit={onSubmit}>
      <ChoiceChips label={m.journeys.how} options={TRANSPORT_MODES} value={mode} onChange={setMode} />
      <div className="field-pair">
        <PlaceField label={m.journeys.from} value={from} onChange={setFrom} onZone={setDepartTimeZone} placeholder={flight ? m.journeys.cityOrCode : m.journeys.lisbon} />
        <PlaceField label={m.journeys.to} value={to} onChange={setTo} onZone={setArriveTimeZone} placeholder={flight ? m.journeys.cityOrCode : m.journeys.porto} />
      </div>
      <DateTimeField label={m.journeys.leaves} date={departDate} time={departTime} required onDate={setDepartDate} onTime={setDepartTime} />
      <ZoneField label={m.journeys.departureLocalTo} value={departTimeZone} onChange={setDepartTimeZone} suggestions={t.zones} />
      <DateTimeField
        label={m.journeys.arrives}
        date={arriveDate || departDate}
        time={arriveTime}
        onDate={setArriveDate}
        onTime={setArriveTime}
        hint={m.journeys.nextDayHint}
      />
      <ZoneField label={m.journeys.arrivalLocalTo} value={arriveTimeZone || departTimeZone} onChange={setArriveTimeZone} suggestions={t.zones} />
      <div className="field-pair">
        <TextField label={flight ? m.journeys.airline : m.journeys.company} value={carrier} onChange={setCarrier} maxLength={200} />
        <TextField label={flight ? m.journeys.flightNo : m.journeys.number} value={number} onChange={setNumber} maxLength={40} autoCapitalize="characters" />
      </div>
      <div className="field-pair">
        <TextField label={m.journeys.seat} value={seat} onChange={setSeat} maxLength={40} />
        <TextField label={m.journeys.bookingRef} value={confirmation} onChange={setConfirmation} maxLength={200} autoCapitalize="characters" autoComplete="off" />
      </div>
      <TextField label={m.common.link} type="url" value={link} onChange={setLink} placeholder={m.journeys.linkPlaceholder} maxLength={2000} />
      <NotesField value={notes} onChange={setNotes} placeholder={m.journeys.notesPlaceholder} />
    </ItemForm>
  )
}

export function TransportPage() {
  const t = useTrip()
  const { itemId } = useParams()
  const r = t.transports.find((x) => x.id === itemId)
  const back = tripPath(t.trip.id)
  if (!r) return <ItemGone backTo={back} />
  const mode = labelOf(TRANSPORT_MODES, r.mode)
  const duration = transportDuration(r)
  const arriveZone = r.arriveTimeZone ?? r.departTimeZone
  const zones = r.departTimeZone === arriveZone ? [r.departTimeZone] : [r.departTimeZone, arriveZone]
  const connection = connections(t.transports).find((c) => c.legs.some((l) => l.id === r.id))
  return (
    <article className="stack">
      <DetailHead emoji={mode.emoji} title={`${r.from} → ${r.to}`} subtitle={[mode.label, r.carrier, r.number].filter(Boolean).join(' · ')} />
      <section className="card">
        <dl className="facts">
          <dt>{m.journeys.leaves}</dt>
          <dd>{fmtDayTime(r.departDate, r.departTime)}</dd>
          {(r.arriveDate || r.arriveTime) && (
            <>
              <dt>{m.journeys.arrives}</dt>
              <dd>{fmtDayTime(r.arriveDate ?? r.departDate, r.arriveTime)}</dd>
            </>
          )}
          {duration !== undefined && (
            <>
              <dt>{m.journeys.takes}</dt>
              <dd>{fmtDuration(duration)}</dd>
            </>
          )}
          {r.seat && (
            <>
              <dt>{m.journeys.seat}</dt>
              <dd>{r.seat}</dd>
            </>
          )}
          {r.confirmation && (
            <>
              <dt>{m.common.booking}</dt>
              <dd>
                <CopyCode code={r.confirmation} />
              </dd>
            </>
          )}
        </dl>
        {(zones.length > 1 || zones[0] !== t.trip.timeZone) && (
          <p className="muted small">{m.journeys.localTimes(zones.map(zoneCity).join(' → '))}</p>
        )}
        <div className="actions">
          <WebLink url={r.link}>{m.journeys.bookingPage}</WebLink>
        </div>
      </section>
      {connection && <ConnectionCard connection={connection} title={m.journeys.partOfConnection(connection.route)} />}
      <section className="card">
        <h3>{m.journeys.gettingThere}</h3>
        <p className="muted small">{m.journeys.directionsTo(r.from)}</p>
        <MapLinks query={mapQuery(r.mode === 'flight' && airportCode(r.from) ? `${airportCode(r.from)} airport` : r.from)} />
      </section>
      {r.notes && (
        <section className="card">
          <h3>{m.common.notes}</h3>
          <p className="prewrap">{r.notes}</p>
        </section>
      )}
      <ReviewsCard target={{ table: 'transports', record: r }} />
      <AttachmentsCard table="transports" id={r.id} />
      <section className="card">
        <h3>{m.common.calendar}</h3>
        <CalendarLinks event={transportEvent(r, m.calendar)} calendarName={t.trip.name} />
      </section>
      <ItemFooter table="transports" id={r.id} what="journey" backTo={back} />
    </article>
  )
}
