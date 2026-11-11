import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { exportBackup, importFile } from '../../db/backupIO'
import { db, setSetting, SETTINGS } from '../../db/db'
import { DataError } from '../../domain/records'
import { downloadJSON } from '../../lib/download'
import { LINKS } from '../../lib/links'
import { requestPersistentStorage } from '../../lib/storage'
import { locale, m } from '../../i18n'
import { Notice } from '../components/bits'
import { SupportLine } from '../components/SupportLine'
import { fmtBytes, mergeSummary } from '../format'
import { useServer, useSetting } from '../hooks'

const stamp = () => new Date().toLocaleDateString('en-CA')

export function SettingsPage() {
  const myName = useSetting<string>(SETTINGS.myName)
  const addressSearch = useSetting<boolean>(SETTINGS.addressSearch)
  // Ticks at once, rather than when the setting is saved.
  const [searchOnline, setSearchOnline] = useState<boolean>()
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string }>()
  const [persisted, setPersisted] = useState<boolean>()
  const snapshots = useLiveQuery(() => db.snapshots.orderBy('createdAt').reverse().toArray(), [])
  const server = useServer()

  const [used, setUsed] = useState<number>()

  useEffect(() => {
    navigator.storage?.persisted?.().then(setPersisted).catch(() => setPersisted(false))
    navigator.storage?.estimate?.().then((e) => setUsed(e.usage)).catch(() => undefined)
  }, [])

  const onExport = async () => {
    downloadJSON(await exportBackup(), `waypoints-backup-${stamp()}.json`)
    setMessage({ kind: 'ok', text: m.settings.backupDownloaded })
  }

  const onImport = async (file: File | undefined) => {
    if (!file) return
    try {
      const { counts, trips } = await importFile(await file.text())
      setMessage({ kind: 'ok', text: m.settings.imported(trips.length, mergeSummary(counts)) })
    } catch (err) {
      setMessage({ kind: 'error', text: err instanceof DataError ? m.reasons.data(err) : m.settings.importFailed })
    }
  }

  return (
    <>
      <h2>{m.settings.title}</h2>
      {message && <Notice kind={message.kind}>{message.text}</Notice>}

      <section className="card">
        <h3>{m.settings.yourName}</h3>
        {myName && (
          <input
            className="input"
            defaultValue={myName.value ?? ''}
            maxLength={60}
            aria-label={m.settings.yourName}
            onBlur={(e) => void setSetting(SETTINGS.myName, e.target.value.trim() || undefined)}
          />
        )}
        <p className="muted small">{m.settings.nameHint}</p>
      </section>

      <section className="card">
        <h3>{m.settings.addressSearch}</h3>
        <p className="muted small">{m.settings.addressSearchText}</p>
        {addressSearch && (
          <label className="check">
            <input
              type="checkbox"
              checked={searchOnline ?? addressSearch.value === true}
              onChange={(e) => {
                setSearchOnline(e.target.checked)
                void setSetting(SETTINGS.addressSearch, e.target.checked || undefined)
              }}
            />
            <span>
              {m.settings.searchOnline}
              <small>{m.settings.searchOnlineHint}</small>
            </span>
          </label>
        )}
      </section>

      <section className="card">
        <h3>{m.settings.syncServer}</h3>
        {server ? (
          <p className="small">
            {m.settings.connectedAs(<strong>{server.member.name}</strong>, new URL(server.url).host, server.lastErrorStatus === 401)}
          </p>
        ) : (
          <p className="muted small">{m.settings.serverOptional}</p>
        )}
        <Link className="btn btn-small" style={{ alignSelf: 'flex-start' }} to="/server">
          {server ? m.settings.serverSettings : m.settings.connectToServer}
        </Link>
      </section>

      <section className="card">
        <h3>{m.settings.backupTransfer}</h3>
        <p className="muted small">{m.settings.backupText}</p>
        <p className="muted small">{m.settings.backupFilesText}</p>
        <div className="stack">
          <button className="btn btn-primary" onClick={() => void onExport()}>
            {m.settings.exportAll}
          </button>
          <label className="btn">
            {m.settings.importFile}
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
            <summary className="muted">{m.settings.safetyCopies(snapshots.length)}</summary>
            <p className="muted">{m.settings.safetyCopiesText}</p>
            <ul className="history">
              {snapshots.map((snap) => (
                <li key={snap.id}>
                  <span>
                    {snap.reason} <span className="muted">· {new Date(snap.createdAt).toLocaleString(locale)}</span>
                  </span>
                  <button
                    className="btn btn-small btn-ghost"
                    aria-label={m.settings.download}
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
        <h3>{m.settings.storage}</h3>
        {used !== undefined && <p className="small">{m.settings.storageUsed(fmtBytes(used))}</p>}
        {persisted ? (
          <p className="muted small">{m.settings.storagePersistent}</p>
        ) : (
          <>
            <p className="muted small">{m.settings.storageMayClear}</p>
            <button className="btn btn-small" onClick={() => void requestPersistentStorage().then(setPersisted)}>
              {m.settings.requestPersistent}
            </button>
          </>
        )}
      </section>

      <section className="card">
        <h3>{m.settings.updates}</h3>
        <p className="muted small">{m.settings.updatesText}</p>
        <Link className="btn btn-small" style={{ alignSelf: 'flex-start' }} to="/whats-new">
          {m.settings.whatsNew}
        </Link>
      </section>

      <section className="card">
        <h3>{m.settings.about}</h3>
        <p className="muted small">
          {m.settings.aboutVersion(
            __APP_VERSION__,
            <a className="link" href={LINKS.github} target="_blank" rel="noreferrer">
              GitHub
            </a>,
          )}
        </p>
        <p className="muted small">
          {m.settings.aboutGuide(
            <a className="link" href={LINKS.guide} target="_blank" rel="noreferrer">
              {m.settings.howToUse}
            </a>,
          )}
        </p>
        <p className="muted small">{m.settings.privacyText}</p>
        <p className="muted small">
          {m.settings.dataCredits(
            <a className="link" href="https://www.geonames.org" target="_blank" rel="noreferrer">
              GeoNames
            </a>,
            <a className="link" href="https://ourairports.com" target="_blank" rel="noreferrer">
              OurAirports
            </a>,
            <a className="link" href="https://github.com/mwgg/Airports" target="_blank" rel="noreferrer">
              mwgg/Airports
            </a>,
          )}
        </p>
        <SupportLine />
      </section>
    </>
  )
}
