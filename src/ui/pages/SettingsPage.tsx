import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { exportBackup, importFile } from '../../db/backupIO'
import { db, setSetting, SETTINGS } from '../../db/db'
import { DataError } from '../../domain/records'
import { downloadJSON } from '../../lib/download'
import { LINKS } from '../../lib/links'
import { requestPersistentStorage } from '../../lib/storage'
import { Notice } from '../components/bits'
import { mergeSummary, plural } from '../format'
import { useSetting } from '../hooks'

const stamp = () => new Date().toLocaleDateString('en-CA')

export function SettingsPage() {
  const myName = useSetting<string>(SETTINGS.myName)
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string }>()
  const [persisted, setPersisted] = useState<boolean>()
  const snapshots = useLiveQuery(() => db.snapshots.orderBy('createdAt').reverse().toArray(), [])

  useEffect(() => {
    navigator.storage?.persisted?.().then(setPersisted).catch(() => setPersisted(false))
  }, [])

  const onExport = async () => {
    downloadJSON(await exportBackup(), `waypoints-backup-${stamp()}.json`)
    setMessage({ kind: 'ok', text: 'Backup downloaded.' })
  }

  const onImport = async (file: File | undefined) => {
    if (!file) return
    try {
      const { counts, trips } = await importFile(await file.text())
      setMessage({ kind: 'ok', text: `Imported ${plural(trips.length, 'trip')}: ${mergeSummary(counts)}.` })
    } catch (err) {
      setMessage({ kind: 'error', text: err instanceof DataError ? err.message : 'Import failed.' })
    }
  }

  return (
    <>
      <h2>Settings</h2>
      {message && <Notice kind={message.kind}>{message.text}</Notice>}

      <section className="card">
        <h3>Your name</h3>
        {myName && (
          <input
            className="input"
            defaultValue={myName.value ?? ''}
            maxLength={60}
            aria-label="Your name"
            onBlur={(e) => void setSetting(SETTINGS.myName, e.target.value.trim() || undefined)}
          />
        )}
        <p className="muted small">Suggested as the first traveller on new trips. It stays on this phone.</p>
      </section>

      <section className="card">
        <h3>Backup & transfer</h3>
        <p className="muted small">
          Your trips are stored on this phone. Export a backup file to keep them safe or to move them to another phone, then
          import it there. Importing merges: each item keeps its newest version, so importing a file twice changes nothing.
        </p>
        <div className="stack">
          <button className="btn btn-primary" onClick={() => void onExport()}>
            ⬇️ Export all trips
          </button>
          <label className="btn">
            ⬆️ Import a file
            <input
              type="file"
              accept="application/json,.json"
              hidden
              onChange={(e) => {
                void onImport(e.target.files?.[0])
                e.target.value = ''
              }}
            />
          </label>
        </div>
        {snapshots && snapshots.length > 0 && (
          <details className="small">
            <summary className="muted">Safety copies ({snapshots.length})</summary>
            <p className="muted">Kept automatically before removing a trip or overwriting it with someone's changes. Download one and import it to get things back.</p>
            <ul className="history">
              {snapshots.map((snap) => (
                <li key={snap.id}>
                  <span>
                    {snap.reason} <span className="muted">· {new Date(snap.createdAt).toLocaleString()}</span>
                  </span>
                  <button
                    className="btn btn-small btn-ghost"
                    aria-label="Download"
                    onClick={() => downloadJSON(snap.data, `waypoints-safety-copy-${snap.createdAt.slice(0, 10)}.json`)}
                  >
                    ⬇️
                  </button>
                </li>
              ))}
            </ul>
          </details>
        )}
      </section>

      <section className="card">
        <h3>Storage</h3>
        {persisted ? (
          <p className="muted small">✅ Storage is persistent: the browser won't clear your trips to free up space.</p>
        ) : (
          <>
            <p className="muted small">
              The browser may clear site data when space runs low (especially on iPhone). Adding waypoints to your Home Screen and
              allowing persistent storage makes this much less likely, but keep a backup anyway.
            </p>
            <button className="btn btn-small" onClick={() => void requestPersistentStorage().then(setPersisted)}>
              Request persistent storage
            </button>
          </>
        )}
      </section>

      <section className="card">
        <h3>Updates</h3>
        <p className="muted small">waypoints updates itself. See what changed in each version.</p>
        <Link className="btn btn-small" style={{ alignSelf: 'flex-start' }} to="/whats-new">
          ✨ What's new
        </Link>
      </section>

      <section className="card">
        <h3>About</h3>
        <p className="muted small">
          waypoints v{__APP_VERSION__} · open source ·{' '}
          <a className="link" href={LINKS.github} target="_blank" rel="noreferrer">
            GitHub
          </a>
        </p>
        <p className="muted small">
          No account, no tracking, no ads. Your trips stay on this phone and only leave it in the links and files you choose to
          send. Maps and calendars open in their own apps; waypoints itself never connects to anything.
        </p>
      </section>
    </>
  )
}
