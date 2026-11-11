import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { addTraveller, setMe } from '../../db/actions'
import { applyMerge, previewMerge } from '../../db/backupIO'
import { SETTINGS } from '../../db/db'
import type { Traveller } from '../../db/types'
import { DataError } from '../../domain/records'
import { hasChanges, type MergeCounts, type TripLink } from '../../domain/sync'
import { inIosBrowser } from '../../lib/platform'
import { readTripLink } from '../../lib/tripLink'
import { EmptyState, Notice } from '../components/bits'
import { HandOff } from '../components/HandOff'
import { m } from '../../i18n'
import { fmtDayRange, fmtTimestamp, mergeSummary } from '../format'
import { useSetting } from '../hooks'
import { tripPath } from '../tripData'

/*
 * A trip link someone sent. Nothing touches this phone's trips until "Add" or "Update" is tapped,
 * and then it's a merge: the newest copy of each item wins, so nothing added here is lost.
 */
export function TripLinkPage() {
  const { data = '' } = useParams()
  const [loaded, setLoaded] = useState<{ data: string; link?: TripLink; error?: string }>()

  useEffect(() => {
    let cancelled = false
    readTripLink(data).then(
      (link) => !cancelled && setLoaded({ data, link }),
      (err) => !cancelled && setLoaded({ data, error: err instanceof DataError ? m.reasons.data(err) : m.share.linkCouldntBeOpened }),
    )
    return () => {
      cancelled = true
    }
  }, [data])

  if (!loaded || loaded.data !== data) return null
  if (!loaded.link) {
    return (
      <EmptyState>
        <p className="big-emoji">🧭</p>
        <p>{loaded.error}</p>
        <Link className="btn" to="/">
          {m.common.yourTrips}
        </Link>
      </EmptyState>
    )
  }
  return <LinkPreview key={data} link={loaded.link} />
}

const live = <T extends { deletedAt?: string }>(records: T[]) => records.filter((r) => !r.deletedAt)

function LinkPreview({ link }: { link: TripLink }) {
  const [trip] = link.tables.trips
  const plan = useLiveQuery(() => previewMerge(link.tables), [link])
  const [handOff, setHandOff] = useState(inIosBrowser)
  const [busy, setBusy] = useState(false)
  const [merged, setMerged] = useState<{ counts: MergeCounts; joined: boolean }>()

  if (!plan) return null
  const travellers = live(link.tables.travellers)
  const isNew = plan.newTrips.length > 0

  const apply = async () => {
    setBusy(true)
    try {
      const counts = await applyMerge(link.tables, m.settings.safetyName.updatingFromLink(trip.name))
      setMerged({ counts, joined: isNew })
    } finally {
      setBusy(false)
    }
  }

  if (merged?.joined) return <WhoAreYou tripId={trip.id} tripName={trip.name} travellers={travellers} />

  const counts = m.share.counts({
    stays: live(link.tables.stays).length,
    journeys: live(link.tables.transports).length,
    activities: live(link.tables.activities).length,
    places: live(link.tables.places).length,
    expenses: live(link.tables.expenses).length,
  })
  const openTrip = (
    <Link className="btn btn-small btn-primary" to={tripPath(trip.id)}>
      {m.share.openTheTrip}
    </Link>
  )

  return (
    <>
      <section className="card">
        <p className="muted small">
          {m.share.sharedBy(link.sentBy)} · {fmtTimestamp(link.sentAt)}
        </p>
        <h2>
          {trip.emoji ?? '🧳'} {trip.name}
        </h2>
        <p className="muted">{fmtDayRange(trip.startDate, trip.endDate)}</p>
        {travellers.length > 0 && <p className="small">{m.share.withPeople(travellers.map((x) => x.name).join(', '))}</p>}
        <ul className="counts">
          {counts.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      </section>

      {merged ? (
        <Notice kind="ok">
          <p>{m.share.copyUpToDate(mergeSummary(merged.counts))}</p>
          {openTrip}
        </Notice>
      ) : handOff ? (
        <HandOff onStayHere={() => setHandOff(false)} />
      ) : isNew ? (
        <div className="stack">
          <button className="btn btn-primary" disabled={busy} onClick={() => void apply()}>
            {m.share.addToMyTrips}
          </button>
          <p className="muted small">{m.share.savedOnPhone}</p>
        </div>
      ) : hasChanges(plan) ? (
        <section className="card">
          <p>{m.share.changesForCopy(mergeSummary(plan.counts))}</p>
          <button className="btn btn-primary" disabled={busy} onClick={() => void apply()}>
            {m.share.updateMyCopy}
          </button>
          <p className="muted small">{m.share.newestVersion}</p>
        </section>
      ) : (
        <Notice kind="ok">
          <p>{m.share.copyAlreadyHasAll}</p>
          {openTrip}
        </Notice>
      )}
    </>
  )
}

function WhoAreYou({ tripId, tripName, travellers }: { tripId: string; tripName: string; travellers: Traveller[] }) {
  const navigate = useNavigate()
  const myName = useSetting<string>(SETTINGS.myName)
  const [name, setName] = useState<string>()
  const typed = name ?? myName?.value ?? ''

  const choose = async (travellerId: string) => {
    await setMe(tripId, travellerId)
    navigate(tripPath(tripId), { replace: true })
  }
  const addMe = async () => {
    if (typed.trim()) await choose(await addTraveller(tripId, typed.trim()))
  }

  return (
    <section className="card">
      <h3>{m.share.isOnYourPhone(tripName)}</h3>
      {travellers.length > 0 && (
        <>
          <p>{m.trip.whichOneAreYou}</p>
          <div className="chips">
            {travellers.map((x) => (
              <button key={x.id} className="toggle-chip" onClick={() => void choose(x.id)}>
                {x.name}
              </button>
            ))}
          </div>
        </>
      )}
      <form
        className="stack"
        onSubmit={(e) => {
          e.preventDefault()
          void addMe()
        }}
      >
        <label className="field">
          <span>{travellers.length ? m.share.notOnList : m.trip.yourName}</span>
          <input className="input" value={typed} maxLength={60} onChange={(e) => setName(e.target.value)} />
        </label>
        <button className="btn" type="submit" disabled={!typed.trim()}>
          {m.share.addMe}
        </button>
      </form>
      <button className="link small" onClick={() => navigate(tripPath(tripId), { replace: true })}>
        {m.share.skipForNow}
      </button>
    </section>
  )
}
