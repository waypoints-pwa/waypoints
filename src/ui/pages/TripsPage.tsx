import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router'
import { db, SETTINGS } from '../../db/db'
import type { Day, Trip } from '../../db/types'
import { tripPhase } from '../../domain/itinerary'
import { language, m } from '../../i18n'
import { guideFor } from '../../lib/links'
import { EmptyState } from '../components/bits'
import { SupportLine } from '../components/SupportLine'
import { WhatsNewCard } from '../components/WhatsNew'
import { fmtDayRange } from '../format'
import { useSetting, useToday, useTrips } from '../hooks'

// Opening the app during a trip goes straight to it, once per launch, and only when the app was
// opened on its home page (not from a link).
const launchedAtHome = typeof location !== 'undefined' && /^#?\/?$/.test(location.hash)
let resumed = false

export function TripsPage() {
  const trips = useTrips()
  const lastTrip = useSetting<string>(SETTINGS.lastTrip)
  const today = useToday()
  const navigate = useNavigate()
  const onServer = useLiveQuery(async () => new Set(await db.serverTrips.toCollection().primaryKeys()), [])

  useEffect(() => {
    if (resumed || !launchedAtHome || !trips || !lastTrip) return
    resumed = true
    const trip = trips.find((t) => t.id === lastTrip.value)
    if (trip && tripPhase(trip, today).phase === 'ongoing') navigate(`/trips/${trip.id}`)
  }, [trips, lastTrip, today, navigate])

  if (!trips) return null
  if (!trips.length) {
    return (
      <>
        {/* Renders nothing on a fresh install, but marks this version's notes as seen. */}
        <WhatsNewCard />
        <Welcome />
      </>
    )
  }

  const groups = { ongoing: [] as Trip[], upcoming: [] as Trip[], past: [] as Trip[] }
  for (const trip of trips) groups[tripPhase(trip, today).phase].push(trip)
  groups.ongoing.sort((a, b) => a.startDate.localeCompare(b.startDate))
  groups.upcoming.sort((a, b) => a.startDate.localeCompare(b.startDate))
  groups.past.sort((a, b) => b.endDate.localeCompare(a.endDate))

  return (
    <>
      <WhatsNewCard />
      <div className="section-head">
        <h2>{m.home.yourTrips}</h2>
        <Link className="btn btn-small btn-primary" to="/new">
          {m.home.newTrip}
        </Link>
      </div>
      <TripGroup title={m.home.groupNow} trips={groups.ongoing} today={today} onServer={onServer} />
      <TripGroup title={m.home.groupComingUp} trips={groups.upcoming} today={today} onServer={onServer} />
      <TripGroup title={m.home.groupPast} trips={groups.past} today={today} onServer={onServer} />
      <Link className="btn btn-ghost" to="/open">
        {m.home.openTripLinkOrFile}
      </Link>
      <SupportLine className="support-line" />
    </>
  )
}

function TripGroup({ title, trips, today, onServer }: { title: string; trips: Trip[]; today: Day; onServer?: Set<string> }) {
  if (!trips.length) return null
  return (
    <section>
      <h3 className="group-title">{title}</h3>
      <ul className="list">
        {trips.map((trip) => (
          <TripRow key={trip.id} trip={trip} today={today} onServer={Boolean(onServer?.has(trip.id))} />
        ))}
      </ul>
    </section>
  )
}

function TripRow({ trip, today, onServer }: { trip: Trip; today: Day; onServer: boolean }) {
  const phase = tripPhase(trip, today)
  const chip =
    phase.phase === 'upcoming'
      ? phase.daysToGo === 1
        ? m.home.tomorrow
        : m.home.inDays(phase.daysToGo)
      : phase.phase === 'ongoing'
        ? m.home.dayOf(phase.day, phase.length)
        : m.home.done
  return (
    <li>
      <Link to={`/trips/${trip.id}`} className="list-row">
        <span className="trip-emoji" aria-hidden>
          {trip.emoji ?? '🧳'}
        </span>
        <span className="list-text">
          <strong>{trip.name}</strong>
          <span className="muted small">
            {fmtDayRange(trip.startDate, trip.endDate)}
            {onServer && m.home.onTheServer}
          </span>
        </span>
        <span className={`chip chip-${phase.phase}`}>{chip}</span>
      </Link>
    </li>
  )
}

function Welcome() {
  return (
    <EmptyState>
      <p className="big-emoji">🧭</p>
      <h2>{m.home.planATrip}</h2>
      <p className="muted">{m.home.welcomeText}</p>
      <Link className="btn btn-primary" to="/new">
        {m.home.newTrip}
      </Link>
      <Link className="btn" to="/open">
        {m.home.openTripSentToYou}
      </Link>
      <p className="muted small">
        {m.home.newHere(
          <a className="link" href={guideFor(language)} target="_blank" rel="noreferrer">
            {m.home.readTheGuide}
          </a>,
        )}
      </p>
    </EmptyState>
  )
}
