import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { removeTripFromPhone, setMe } from '../../db/actions'
import { buildICS, tripEvents } from '../../domain/calendar'
import { tripPhase } from '../../domain/itinerary'
import { progress } from '../../domain/packing'
import { daysBetween, timeZoneName, zoneCity } from '../../domain/time'
import { downloadBlob, fileSlug } from '../../lib/download'
import { leaveTrip } from '../../sync/account'
import { m } from '../../i18n'
import { Notice } from '../components/bits'
import { ServerStatus } from '../components/ServerStatus'
import { currencyName, fmtDayRange } from '../format'
import { usable, useNow, useServer, useToday } from '../hooks'
import { tripPath, useTrip, type TripData } from '../tripData'

export function TripInfoPage() {
  const t = useTrip()
  const navigate = useNavigate()
  const now = useNow()
  const today = useToday()
  const { trip } = t
  const group = t.travellers.length > 1
  const packing = progress(t.packingItems)
  const events = tripEvents(t.stays, t.transports, t.activities)

  const downloadCalendar = () =>
    downloadBlob(new Blob([buildICS(events, trip.name)], { type: 'text/calendar' }), `${fileSlug(trip.name)}.ics`)

  const server = usable(useServer())

  const remove = async () => {
    if (!confirm(m.trip.removeConfirm(trip.name, group, filesGo(t)))) return
    await removeTripFromPhone(trip)
    navigate('/', { replace: true })
  }

  return (
    <>
      <section className="card">
        <div className="section-head">
          <h3>
            {trip.emoji ?? '🧳'} {trip.name}
          </h3>
          <Link className="btn btn-small" to={tripPath(trip.id, 'edit')}>
            {m.items.editButton}
          </Link>
        </div>
        <dl className="facts">
          <dt>{m.trip.dates}</dt>
          <dd>
            {fmtDayRange(trip.startDate, trip.endDate)} · {m.plan.days(daysBetween(trip.startDate, trip.endDate) + 1)}
          </dd>
          <dt>{m.trip.timeZone}</dt>
          <dd>
            {zoneCity(trip.timeZone)} ({timeZoneName(trip.timeZone, now)})
          </dd>
          <dt>{m.trip.currency}</dt>
          <dd>
            {trip.currency} · {currencyName(trip.currency)}
          </dd>
        </dl>
        {trip.notes && <p className="prewrap">{trip.notes}</p>}
      </section>

      <section className="card">
        <h3>{m.trip.whosGoing}</h3>
        <p>{t.travellers.map((x) => (t.server && t.linked.includes(x) ? '🌐 ' : '') + x.name + (x.id === t.me?.id ? m.trip.youParen : '')).join(', ')}</p>
        {t.server && <p className="muted small">{m.trip.onSyncServerNote}</p>}
        {group && (
          <label className="field">
            <span>{m.trip.whichOneAreYou}</span>
            <select className="input" value={t.me?.id ?? ''} onChange={(e) => void setMe(trip.id, e.target.value || undefined)}>
              {!t.me && <option value="">{m.trip.choose}</option>}
              {t.travellers.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.name}
                </option>
              ))}
            </select>
            <small className="muted">{m.trip.whichOneHint}</small>
          </label>
        )}
      </section>

      {t.server ? (
        <OnServerCard t={t} />
      ) : (
        <section className="card">
          <h3>{m.trip.shareWithGroup}</h3>
          <p className="muted small">
            {group
              ? t.unsent
                ? m.trip.unsentChanges(t.unsent)
                : m.trip.othersUpToDate
              : m.trip.sendToPeople}
          </p>
          <Link className="btn btn-primary" to={tripPath(trip.id, 'share')}>
            {m.trip.shareTheTrip}
          </Link>
          {server && <ServerOffer t={t} />}
        </section>
      )}

      <section className="card">
        <h3>{m.trip.packingTodo}</h3>
        <p className="muted small">{packing.total ? m.trip.packedOf(packing.packed, packing.total) : m.trip.nothingHereYet}</p>
        <Link className="btn" to={tripPath(trip.id, 'packing')}>
          {m.trip.openTheList}
        </Link>
      </section>

      <section className="card">
        <h3>{m.trip.tripReport}</h3>
        <p className="muted small">
          {m.trip.tripReportText}
        </p>
        <Link className="btn" to={tripPath(trip.id, 'report')}>
          {tripPhase(trip, today).phase === 'past' ? m.trip.seeTheReport : m.trip.seeTripSoFar}
        </Link>
      </section>

      <section className="card">
        <h3>{m.common.calendar}</h3>
        <p className="muted small">
          {m.trip.calendarText(events.length)}
        </p>
        <button className="btn" disabled={!events.length} onClick={downloadCalendar}>
          {m.trip.downloadCalendar}
        </button>
      </section>

      {t.server ? (
        <LeaveCard t={t} />
      ) : (
        <section className="card">
          <h3>{m.trip.removeFromPhone}</h3>
          <p className="muted small">
            {m.trip.removeFromPhoneText(group)}
          </p>
          <button className="btn btn-danger" onClick={() => void remove()}>
            {m.trip.removeFromPhone}
          </button>
        </section>
      )}
    </>
  )
}

/** Photos and documents that exist only on this phone are lost with the trip: safety copies can't keep files. */
function filesGo(t: TripData): string {
  const onlyHere = t.attachments.filter((a) => !t.server || a.private).length
  if (!onlyHere) return ''
  return m.trip.filesGo(onlyHere)
}

function OnServerCard({ t }: { t: TripData }) {
  const others = t.viaLinks.filter((x) => x.id !== t.me?.id)
  return (
    <section className="card">
      <h3>{m.trip.onSyncServer}</h3>
      <p className="muted small">{m.trip.onSyncServerText}</p>
      <ServerStatus waiting={t.waiting} />
      {others.length > 0 && (
        <>
          <p className="small">
            {m.trip.notOnServerByLink(others.map((x) => x.name).join(', '), others.length, t.unsent)}
          </p>
          <Link className="btn btn-primary" to={tripPath(t.trip.id, 'share')}>
            {m.trip.sendThemALink}
          </Link>
        </>
      )}
      {others.length === 0 && (
        <Link className="btn" to={tripPath(t.trip.id, 'share')}>
          {m.trip.shareALink}
        </Link>
      )}
      <p className="muted small">{m.trip.editToAddPeople}</p>
    </section>
  )
}

function LeaveCard({ t }: { t: TripData }) {
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()

  const leave = async () => {
    if (!confirm(m.trip.leaveConfirm(t.trip.name, filesGo(t)))) return
    setBusy(true)
    setError(undefined)
    try {
      await leaveTrip(t.trip.id)
      navigate('/', { replace: true })
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="card">
      <h3>{m.trip.leaveTheTrip}</h3>
      <p className="muted small">
        {m.trip.leaveText}
      </p>
      {error && <Notice kind="error">{error}</Notice>}
      <button className="btn btn-danger" disabled={busy} onClick={() => void leave()}>
        {busy ? m.trip.leaving : m.trip.leaveTheTrip}
      </button>
    </section>
  )
}

/**
 * A trip that's only on this phone can go on the server, unless others already have it there (this
 * phone was taken off it, or never added): then only someone on it can add you.
 */
function ServerOffer({ t }: { t: TripData }) {
  const there = t.linked.filter((x) => x.id !== t.me?.id)
  if (there.length) {
    return (
      <p className="muted small">
        {m.trip.othersHaveItOnServer(there.map((x) => x.name).join(', '), there.length)}
      </p>
    )
  }
  return (
    <>
      <p className="muted small">{m.trip.putOnYourServer}</p>
      <Link className="btn" to={tripPath(t.trip.id, 'server')}>
        {m.trip.putOnServer}
      </Link>
    </>
  )
}
