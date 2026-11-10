import { useState } from 'react'
import { useParams, useSearchParams } from 'react-router'
import { m } from '../../i18n'
import type { Day, Stay, StayKind } from '../../db/types'
import { stayEvent } from '../../domain/calendar'
import { tripPhase } from '../../domain/itinerary'
import { mapQuery } from '../../domain/links'
import { addDays, daysBetween, isDay, toDay, zoneCity } from '../../domain/time'
import { CopyCode, DetailHead } from '../components/bits'
import { ChoiceChips, DateTimeField, NotesField, TextField, ZoneField } from '../components/fields'
import { AddressField, CityField } from '../components/PlaceFields'
import { CalendarLinks, MapLinks, PhoneLink, WebLink } from '../components/ItemLinks'
import { fmtDayTime } from '../format'
import { labelOf, STAY_KINDS } from '../labels'
import { tripPath, useTrip, type TripData } from '../tripData'
import { AttachmentsCard } from '../components/Attachments'
import { ReviewsCard } from '../components/Reviews'
import { ItemFooter, ItemForm, ItemGone } from './common'
import { opt, useSave } from './save'
import { useItemZone } from './zone'

/** A new stay starts where the last one ended (or on the first day) and runs to the end of the trip. */
function suggestedDates(t: TripData, date: string | null): { checkIn: Day; checkOut: Day } {
  const { trip } = t
  const lastCheckOut = t.stays.map((s) => s.checkOutDate).sort().at(-1)
  const today = toDay(new Date())
  const checkIn =
    date && isDay(date)
      ? date
      : lastCheckOut && lastCheckOut < trip.endDate
        ? lastCheckOut
        : tripPhase(trip, today).phase === 'ongoing'
          ? today
          : trip.startDate
  return { checkIn, checkOut: trip.endDate > checkIn ? trip.endDate : addDays(checkIn, 1) }
}

export function StayFormPage() {
  const t = useTrip()
  const { itemId } = useParams()
  const [params] = useSearchParams()
  const existing = itemId ? t.stays.find((s) => s.id === itemId) : undefined
  if (itemId && !existing) return <ItemGone backTo={tripPath(t.trip.id)} />
  return <StayForm key={itemId ?? 'new'} existing={existing} date={params.get('date')} />
}

function StayForm({ existing, date }: { existing?: Stay; date: string | null }) {
  const t = useTrip()
  const [suggested] = useState(() => suggestedDates(t, date))
  const [name, setName] = useState(existing?.name ?? '')
  const [kind, setKind] = useState<string>(existing?.kind ?? 'hotel')
  const [city, setCity] = useState(existing?.city ?? '')
  const [address, setAddress] = useState(existing?.address ?? '')
  const [checkInDate, setCheckInDate] = useState(existing?.checkInDate ?? suggested.checkIn)
  const [checkInTime, setCheckInTime] = useState(existing?.checkInTime ?? '')
  const [checkOutDate, setCheckOutDate] = useState(existing?.checkOutDate ?? suggested.checkOut)
  const [checkOutTime, setCheckOutTime] = useState(existing?.checkOutTime ?? '')
  const [timeZone, setTimeZone] = useItemZone(existing?.timeZone, checkInDate)
  const [confirmation, setConfirmation] = useState(existing?.confirmation ?? '')
  const [phone, setPhone] = useState(existing?.phone ?? '')
  const [link, setLink] = useState(existing?.link ?? '')
  const [notes, setNotes] = useState(existing?.notes ?? '')
  const { save, busy, error, setError } = useSave('stays', existing?.id)

  const onSubmit = () => {
    if (!name.trim()) return setError(m.stays.giveName)
    if (!isDay(checkInDate) || !isDay(checkOutDate)) return setError(m.stays.chooseDays)
    if (checkOutDate < checkInDate) return setError(m.stays.checkOutBeforeCheckIn)
    void save({
      name: name.trim(),
      kind: kind as StayKind,
      city: opt(city),
      address: opt(address),
      checkInDate,
      checkInTime: checkInTime || undefined,
      checkOutDate,
      checkOutTime: checkOutTime || undefined,
      timeZone,
      confirmation: opt(confirmation),
      phone: opt(phone),
      link: opt(link),
      notes: opt(notes),
    })
  }

  return (
    <ItemForm title={existing ? m.stays.editTitle : m.stays.newTitle} error={error} busy={busy} onSubmit={onSubmit}>
      <TextField label={m.common.name} value={name} onChange={setName} placeholder={m.stays.namePlaceholder} maxLength={200} autoFocus={!existing} />
      <ChoiceChips label={m.stays.type} options={STAY_KINDS} value={kind} onChange={setKind} />
      <CityField value={city} onChange={setCity} onZone={setTimeZone} />
      <AddressField
        value={address}
        onChange={setAddress}
        city={city}
        onPlace={(p) => {
          if (city.trim()) return
          setCity(p.city)
          if (p.zone) setTimeZone(p.zone)
        }}
      />
      <DateTimeField
        label={m.stays.checkIn}
        date={checkInDate}
        time={checkInTime}
        required
        onDate={(v) => {
          setCheckInDate(v)
          if (isDay(v) && checkOutDate <= v) setCheckOutDate(addDays(v, 1))
        }}
        onTime={setCheckInTime}
      />
      <DateTimeField label={m.stays.checkOut} date={checkOutDate} time={checkOutTime} required onDate={setCheckOutDate} onTime={setCheckOutTime} />
      <ZoneField value={timeZone} onChange={setTimeZone} suggestions={t.zones} />
      <TextField label={m.stays.bookingReference} value={confirmation} onChange={setConfirmation} maxLength={200} autoCapitalize="characters" autoComplete="off" />
      <TextField label={m.common.phone} type="tel" value={phone} onChange={setPhone} maxLength={40} />
      <TextField label={m.common.link} type="url" value={link} onChange={setLink} placeholder={m.stays.linkPlaceholder} maxLength={2000} />
      <NotesField value={notes} onChange={setNotes} placeholder={m.stays.notesPlaceholder} />
    </ItemForm>
  )
}

export function StayPage() {
  const t = useTrip()
  const { itemId } = useParams()
  const stay = t.stays.find((s) => s.id === itemId)
  const back = tripPath(t.trip.id)
  if (!stay) return <ItemGone backTo={back} />
  const kind = labelOf(STAY_KINDS, stay.kind)
  return (
    <article className="stack">
      <DetailHead emoji={kind.emoji} title={stay.name} subtitle={[kind.label, stay.city].filter(Boolean).join(' · ')} />
      <section className="card">
        <dl className="facts">
          <dt>{m.stays.checkIn}</dt>
          <dd>{fmtDayTime(stay.checkInDate, stay.checkInTime)}</dd>
          <dt>{m.stays.checkOut}</dt>
          <dd>{fmtDayTime(stay.checkOutDate, stay.checkOutTime)}</dd>
          <dt>{m.stays.stay}</dt>
          <dd>{m.stays.nights(daysBetween(stay.checkInDate, stay.checkOutDate))}</dd>
          {stay.confirmation && (
            <>
              <dt>{m.common.booking}</dt>
              <dd>
                <CopyCode code={stay.confirmation} />
              </dd>
            </>
          )}
          {stay.phone && (
            <>
              <dt>{m.common.phone}</dt>
              <dd>{stay.phone}</dd>
            </>
          )}
        </dl>
        {stay.timeZone !== t.trip.timeZone && <p className="muted small">{m.stays.timesAre(zoneCity(stay.timeZone))}</p>}
        <div className="actions">
          <PhoneLink phone={stay.phone} />
          <WebLink url={stay.link}>{m.stays.bookingPage}</WebLink>
        </div>
      </section>
      {(stay.address || stay.city) && (
        <section className="card">
          <h3>{m.common.address}</h3>
          {stay.address && <p className="prewrap">{stay.address}</p>}
          <MapLinks query={mapQuery(stay.address ?? stay.name, stay.city)} />
        </section>
      )}
      {stay.notes && (
        <section className="card">
          <h3>{m.common.notes}</h3>
          <p className="prewrap">{stay.notes}</p>
        </section>
      )}
      <ReviewsCard target={{ table: 'stays', record: stay }} />
      <AttachmentsCard table="stays" id={stay.id} />
      <section className="card">
        <h3>{m.common.calendar}</h3>
        <CalendarLinks event={stayEvent(stay)} calendarName={t.trip.name} />
      </section>
      <ItemFooter table="stays" id={stay.id} what="stay" backTo={back} />
    </article>
  )
}
