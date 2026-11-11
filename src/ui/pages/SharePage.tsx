import { useEffect, useState } from 'react'
import { clearUnsent } from '../../db/actions'
import { exportTripFile, readTables } from '../../db/backupIO'
import { downloadJSON, fileSlug } from '../../lib/download'
import { shareUrl } from '../../lib/shareSheet'
import { LONG_LINK_CHARS, tripLink } from '../../lib/tripLink'
import { Notice } from '../components/bits'
import { Field } from '../components/fields'
import { locale, m } from '../../i18n'
import { needsLinks, useTrip } from '../tripData'

export function SharePage() {
  const t = useTrip()
  const { trip } = t
  const [sentBy, setSentBy] = useState(t.me?.name ?? '')
  const [link, setLink] = useState<string>()
  const [result, setResult] = useState<'shared' | 'copied'>()
  const [busy, setBusy] = useState(false)

  // The link is rebuilt whenever the trip changes, so it always holds the latest version.
  useEffect(() => {
    let cancelled = false
    readTables(trip.id)
      .then((tables) => tripLink(tables, sentBy))
      .then((url) => !cancelled && setLink(url))
    return () => {
      cancelled = true
    }
  }, [t, trip.id, sentBy])

  const onShare = async () => {
    if (!link) return
    setBusy(true)
    try {
      const who = sentBy.trim()
      const text = m.share.shareText(who, trip.name)
      const outcome = await shareUrl(link, trip.name, text)
      setResult(outcome)
      if (outcome) await clearUnsent(trip.id)
    } finally {
      setBusy(false)
    }
  }

  const onSaveFile = async () => downloadJSON(await exportTripFile(trip.id), `${fileSlug(trip.name)}.waypoints.json`)

  const counts = m.share.counts({
    stays: t.stays.length,
    journeys: t.transports.length,
    activities: t.activities.length,
    places: t.places.length,
    expenses: t.expenses.length,
  })

  return (
    <>
      <h2>{m.trip.shareWithGroup}</h2>
      {t.server && <ServerNote />}
      <p className="muted">{m.share.intro}</p>
      <ul className="steps small muted">
        <li>{m.share.noServerInvolved}</li>
        <li>{m.share.mergedItemByItem}</li>
      </ul>

      <Field label={m.trip.yourName} hint={m.share.nameHint}>
        <input className="input" value={sentBy} maxLength={60} placeholder={m.files.optional} onChange={(e) => setSentBy(e.target.value)} />
      </Field>

      <section className="card">
        <p className="small">
          <strong>{counts.join(' · ')}</strong>
        </p>
        {needsLinks(t) && <p className="small muted">{m.share.includesUnsent(t.unsent)}</p>}
        <button className="btn btn-primary" disabled={!link || busy} onClick={() => void onShare()}>
          {result === 'copied' ? m.common.linkCopied : result === 'shared' ? m.common.shared : m.share.shareTripLink}
        </button>
        {result === 'copied' && <p className="small muted">{m.share.pasteIntoChat}</p>}
        {link && link.length > LONG_LINK_CHARS && (
          <Notice kind="warn">
            <span className="small">{m.share.longLink(link.length.toLocaleString(locale))}</span>
          </Notice>
        )}
        <button className="btn" onClick={() => void onSaveFile()}>
          {m.share.saveAsFile}
        </button>
        <p className="muted small">{m.share.anyoneWithLink(<strong>{m.share.openLinkOrFile}</strong>)}</p>
      </section>
    </>
  )
}

/** On a trip on the server, links are only needed for the people who aren't on it. */
function ServerNote() {
  const t = useTrip()
  const onServer = t.linked.map((x) => x.name)
  const others = t.viaLinks.filter((x) => x.id !== t.me?.id).map((x) => x.name)
  return (
    <p className="notice notice-info small">{m.share.serverNote(onServer, others)}</p>
  )
}
