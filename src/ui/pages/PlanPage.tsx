import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router'
import type { Day } from '../../db/types'
import { connections } from '../../domain/bookings'
import { buildPlan, nextUp, planEntries, tripPhase, type PlanDay, type PlanEntry } from '../../domain/itinerary'
import { mapQuery } from '../../domain/links'
import { daysBetween } from '../../domain/time'
import { CopyCode } from '../components/bits'
import { ConnectionCard } from '../components/ConnectionCard'
import { MapLinks } from '../components/ItemLinks'
import { UnsentNotice } from '../components/UnsentNotice'
import { m } from '../../i18n'
import { describeEntry } from '../entries'
import { fmtDay, fmtDayRange, fmtDayTime, fmtTime } from '../format'
import { useNow, useToday } from '../hooks'
import { labelOf, STAY_KINDS, TRANSPORT_MODES } from '../labels'
import { tripPath, useTrip } from '../tripData'
import { ReviewsLink } from './ReviewsPage'

export function PlanPage() {
  const t = useTrip()
  const today = useToday()
  const now = useNow()
  const [params, setParams] = useSearchParams()
  const view = params.get('view') === 'bookings' ? 'bookings' : 'days'
  const plan = useMemo(() => buildPlan(t.trip, t.stays, t.transports, t.activities), [t])
  const entries = useMemo(() => planEntries(t.stays, t.transports, t.activities), [t])
  const id = t.trip.id

  return (
    <>
      <StatusCard plan={plan} entries={entries} today={today} now={now} />
      <ReviewsLink now={now} />
      <UnsentNotice />
      <div className="segmented" role="tablist" aria-label={m.plan.viewLabel}>
        <button role="tab" aria-selected={view === 'days'} className={view === 'days' ? 'active' : ''} onClick={() => setParams({}, { replace: true })}>
          {m.plan.dayByDay}
        </button>
        <button
          role="tab"
          aria-selected={view === 'bookings'}
          className={view === 'bookings' ? 'active' : ''}
          onClick={() => setParams({ view: 'bookings' }, { replace: true })}
        >
          {m.plan.bookings}
        </button>
      </div>
      <div className="actions">
        <Link className="btn btn-small" to={tripPath(id, 'stays', 'new')}>
          {m.plan.addStay}
        </Link>
        <Link className="btn btn-small" to={tripPath(id, 'transport', 'new')}>
          {m.plan.addTransport}
        </Link>
        <Link className="btn btn-small" to={tripPath(id, 'activities', 'new')}>
          {m.plan.addActivity}
        </Link>
      </div>
      {view === 'days' ? <Days plan={plan} today={today} /> : <Bookings />}
    </>
  )
}

function StatusCard({ plan, entries, today, now }: { plan: PlanDay[]; entries: PlanEntry[]; today: Day; now: number }) {
  const t = useTrip()
  const { trip } = t
  const phase = tripPhase(trip, today)

  if (phase.phase === 'upcoming') {
    const first = entries.find((e) => e.day >= trip.startDate) ?? entries[0]
    return (
      <section className="card status">
        <h3>{phase.daysToGo === 1 ? m.plan.tomorrow : m.plan.daysToGo(phase.daysToGo)}</h3>
        <p className="muted small">
          {fmtDayRange(trip.startDate, trip.endDate)} · {m.plan.days(daysBetween(trip.startDate, trip.endDate) + 1)} ·{' '}
          {m.plan.travellers(t.travellers.length)}
        </p>
        {first && <EntryLine label={m.plan.firstUp} entry={first} />}
      </section>
    )
  }
  if (phase.phase === 'past') {
    return (
      <section className="card status">
        <div className="section-head">
          <h3>{m.plan.tripOver}</h3>
          <Link className="btn btn-small btn-primary" to={tripPath(trip.id, 'report')}>
            {m.plan.tripReport}
          </Link>
        </div>
        <p className="muted small">
          {m.plan.endedAgo(phase.daysAgo)}{' '}
          {t.travellers.length > 1 && (
            m.plan.seeWhoOwes(
              <Link className="link" to={tripPath(trip.id, 'money')}>
                {m.plan.money}
              </Link>,
            )
          )}
        </p>
      </section>
    )
  }

  const night = plan.find((d) => d.day === today)?.night
  const next = nextUp(entries, today, now)
  return (
    <section className="card card-accent status">
      <h3>
        {m.plan.dayOf(phase.day, phase.length)}
      </h3>
      {next ? <EntryLine label={m.plan.next} entry={next} /> : <p className="muted small">{m.plan.nothingElseToday}</p>}
      {night && (
        <>
          <p className="status-line">
            <span aria-hidden>🌙</span>
            <span>
              {m.plan.tonight}{' '}
              <Link className="link" to={tripPath(trip.id, 'stays', night.id)}>
                {night.name}
              </Link>
              {night.address && <span className="muted"> · {night.address}</span>}
            </span>
          </p>
          <MapLinks query={mapQuery(night.address ?? night.name, night.city)} />
        </>
      )}
    </section>
  )
}

function EntryLine({ label, entry }: { label: string; entry: PlanEntry }) {
  const t = useTrip()
  const view = describeEntry(entry, t)
  return (
    <p className="status-line">
      <span aria-hidden>{view.emoji}</span>
      <span>
        {label}:{' '}
        <Link className="link" to={view.to}>
          {view.title}
        </Link>{' '}
        <span className="muted">· {fmtDayTime(entry.day, entry.time)}</span>
      </span>
    </p>
  )
}

function Days({ plan, today }: { plan: PlanDay[]; today: Day }) {
  // During the trip, the days already behind you fold away.
  const earlier = plan.some((d) => d.day === today) ? plan.filter((d) => d.day < today) : []
  const rest = plan.filter((d) => !earlier.includes(d))
  return (
    <>
      {earlier.length > 0 && (
        <details className="earlier">
          <summary>{m.plan.earlierDays(earlier.length)}</summary>
          {earlier.map((d) => (
            <DayView key={d.day} day={d} today={today} />
          ))}
        </details>
      )}
      {rest.map((d) => (
        <DayView key={d.day} day={d} today={today} />
      ))}
    </>
  )
}

function DayView({ day, today }: { day: PlanDay; today: Day }) {
  const t = useTrip()
  return (
    <section className={`day${day.day === today ? ' day-today' : ''}`}>
      <div className="day-head">
        <h3>{day.day === today ? m.plan.dayToday(fmtDay(day.day)) : fmtDay(day.day)}</h3>
        <span className="muted small">{day.inTrip ? m.plan.dayN(day.number) : day.number < 1 ? m.plan.beforeTrip : m.plan.afterTrip}</span>
      </div>
      {day.entries.length > 0 ? (
        <ul className="list">
          {day.entries.map((e) => (
            <EntryRow key={`${e.kind}-${e.record.id}`} entry={e} />
          ))}
        </ul>
      ) : (
        <p className="muted small">
          {m.plan.nothingPlanned}{' '}
          <Link className="link" to={`${tripPath(t.trip.id, 'activities', 'new')}?date=${day.day}`}>
            {m.plan.addAnActivity}
          </Link>
        </p>
      )}
      {day.night && (
        <p className="night">
          {m.plan.nightAt(<Link to={tripPath(t.trip.id, 'stays', day.night.id)}>{day.night.name}</Link>)}
        </p>
      )}
    </section>
  )
}

function EntryRow({ entry }: { entry: PlanEntry }) {
  const t = useTrip()
  const view = describeEntry(entry, t)
  return (
    <li>
      <Link to={view.to} className="list-row">
        <span className="entry-time">
          {entry.time ? fmtTime(entry.time) : ''}
          {view.zone && <small>{view.zone}</small>}
        </span>
        <span className="list-emoji" aria-hidden>
          {view.emoji}
        </span>
        <span className="list-text">
          <strong>{view.title}</strong>
          {view.detail && <span className="muted small">{view.detail}</span>}
        </span>
      </Link>
    </li>
  )
}

function Bookings() {
  const t = useTrip()
  const id = t.trip.id
  const transports = [...t.transports].sort((a, b) => (a.departDate + (a.departTime ?? '')).localeCompare(b.departDate + (b.departTime ?? '')))
  const links = connections(t.transports)
  const stays = [...t.stays].sort((a, b) => a.checkInDate.localeCompare(b.checkInDate))
  const activities = [...t.activities].sort((a, b) => (a.date + (a.startTime ?? '')).localeCompare(b.date + (b.startTime ?? '')))
  return (
    <>
      {links.length > 0 && (
        <section>
          <h3 className="group-title">{m.plan.connections}</h3>
          {links.map((c) => (
            <ConnectionCard key={c.legs[0].id} connection={c} title={`${c.route} · ${m.plan.stops(c.stops)}`} />
          ))}
        </section>
      )}
      <BookingGroup title={m.plan.transport} empty={m.plan.noTransport}>
        {transports.map((r) => (
          <BookingRow
            key={r.id}
            to={tripPath(id, 'transport', r.id)}
            emoji={labelOf(TRANSPORT_MODES, r.mode).emoji}
            title={`${r.from} → ${r.to}`}
            detail={[fmtDayTime(r.departDate, r.departTime), [r.carrier, r.number].filter(Boolean).join(' ')].filter(Boolean).join(' · ')}
            code={r.confirmation}
          />
        ))}
      </BookingGroup>
      <BookingGroup title={m.plan.stays} empty={m.plan.noStays}>
        {stays.map((r) => (
          <BookingRow
            key={r.id}
            to={tripPath(id, 'stays', r.id)}
            emoji={labelOf(STAY_KINDS, r.kind).emoji}
            title={r.name}
            detail={`${fmtDay(r.checkInDate)} → ${fmtDay(r.checkOutDate)} · ${m.plan.nights(daysBetween(r.checkInDate, r.checkOutDate))}`}
            code={r.confirmation}
          />
        ))}
      </BookingGroup>
      <BookingGroup title={m.plan.activities} empty={m.plan.noActivities}>
        {activities.map((r) => (
          <BookingRow
            key={r.id}
            to={tripPath(id, 'activities', r.id)}
            emoji="🎟️"
            title={r.title}
            detail={[fmtDayTime(r.date, r.startTime), r.endTime && m.plan.until(fmtTime(r.endTime)), r.city].filter(Boolean).join(' · ')}
            code={r.confirmation}
          />
        ))}
      </BookingGroup>
    </>
  )
}

function BookingGroup({ title, empty, children }: { title: string; empty: string; children: React.ReactNode[] }) {
  return (
    <section>
      <h3 className="group-title">{title}</h3>
      {children.length ? <ul className="list">{children}</ul> : <p className="muted small">{empty}</p>}
    </section>
  )
}

function BookingRow({ to, emoji, title, detail, code }: { to: string; emoji: string; title: string; detail: string; code?: string }) {
  return (
    <li className="list-row">
      <Link to={to} className="row-link">
        <span className="list-emoji" aria-hidden>
          {emoji}
        </span>
        <span className="list-text">
          <strong>{title}</strong>
          <span className="muted small">{detail}</span>
        </span>
      </Link>
      {code && <CopyCode code={code} />}
    </li>
  )
}
