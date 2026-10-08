import { Link, useNavigate } from 'react-router'
import { removeTripFromPhone, setMe } from '../../db/actions'
import { buildICS, tripEvents } from '../../domain/calendar'
import { daysBetween, timeZoneName, zoneCity } from '../../domain/time'
import { downloadBlob, fileSlug } from '../../lib/download'
import { currencyName, fmtDayRange, plural } from '../format'
import { useNow } from '../hooks'
import { tripPath, useTrip } from '../tripData'

export function TripInfoPage() {
  const t = useTrip()
  const navigate = useNavigate()
  const now = useNow()
  const { trip } = t
  const group = t.travellers.length > 1
  const events = tripEvents(t.stays, t.transports, t.activities)

  const downloadCalendar = () =>
    downloadBlob(new Blob([buildICS(events, trip.name)], { type: 'text/calendar' }), `${fileSlug(trip.name)}.ics`)

  const remove = async () => {
    const others = group ? ' The others keep their copy, and a link from them brings it back.' : ''
    if (!confirm(`Remove “${trip.name}” from this phone?${others} A safety copy is kept in Settings.`)) return
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
            ✏️ Edit
          </Link>
        </div>
        <dl className="facts">
          <dt>Dates</dt>
          <dd>
            {fmtDayRange(trip.startDate, trip.endDate)} · {plural(daysBetween(trip.startDate, trip.endDate) + 1, 'day')}
          </dd>
          <dt>Time zone</dt>
          <dd>
            {zoneCity(trip.timeZone)} ({timeZoneName(trip.timeZone, now)})
          </dd>
          <dt>Currency</dt>
          <dd>
            {trip.currency} · {currencyName(trip.currency)}
          </dd>
        </dl>
        {trip.notes && <p className="prewrap">{trip.notes}</p>}
      </section>

      <section className="card">
        <h3>Who's going</h3>
        <p>{t.travellers.map((x) => x.name + (x.id === t.me?.id ? ' (you)' : '')).join(', ')}</p>
        {group && (
          <label className="field">
            <span>Which one are you?</span>
            <select className="input" value={t.me?.id ?? ''} onChange={(e) => void setMe(trip.id, e.target.value || undefined)}>
              {!t.me && <option value="">Choose…</option>}
              {t.travellers.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.name}
                </option>
              ))}
            </select>
            <small className="muted">Only on this phone: who “paid by” starts as, and your part of the spending.</small>
          </label>
        )}
      </section>

      <section className="card">
        <h3>Share with the group</h3>
        <p className="muted small">
          {group
            ? t.unsent
              ? `You have ${plural(t.unsent, 'change')} the others haven't seen yet.`
              : "The others have had everything you've changed."
            : 'Send the trip to the people going: they get their own copy, and can add places and expenses too.'}
        </p>
        <Link className="btn btn-primary" to={tripPath(trip.id, 'share')}>
          🔗 Share the trip
        </Link>
      </section>

      <section className="card">
        <h3>Calendar</h3>
        <p className="muted small">
          A calendar file with every stay, journey and activity ({events.length}). Open it on your phone to add them to Google or
          Apple Calendar. Downloading it again after changes updates the events instead of copying them.
        </p>
        <button className="btn" disabled={!events.length} onClick={downloadCalendar}>
          📅 Download calendar (.ics)
        </button>
      </section>

      <section className="card">
        <h3>Remove from this phone</h3>
        <p className="muted small">
          Deletes the trip from this phone only.{group && ' The others keep their copy.'} A safety copy is kept in Settings → Backup.
        </p>
        <button className="btn btn-danger" onClick={() => void remove()}>
          Remove from this phone
        </button>
      </section>
    </>
  )
}
