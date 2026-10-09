import { useState } from 'react'
import { Link } from 'react-router'
import { runSync } from '../../sync/client'
import { fmtAgo, plural } from '../format'
import { useNow, useServer } from '../hooks'

/** When the last sync was, what's waiting, and what went wrong, with a "Sync now" button. */
export function ServerStatus({ waiting }: { waiting: number }) {
  const server = useServer()
  const now = useNow()
  const [busy, setBusy] = useState(false)
  if (!server) return null

  if (server.lastErrorStatus === 401) {
    return (
      <div className="notice notice-warn small" role="status">
        <p>This phone was disconnected from the sync server. Your trips are still here.</p>
        <Link className="btn btn-small" to="/server">
          Sync server settings
        </Link>
      </div>
    )
  }

  const syncNow = async () => {
    setBusy(true)
    try {
      await runSync()
    } catch {
      // Kept in the server config, and shown below.
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="stack">
      {server.lastError ? (
        <p className="notice notice-warn small">
          Couldn't sync{server.lastSyncAt ? ` (last time ${fmtAgo(server.lastSyncAt, now)})` : ''}: {server.lastError}
          {waiting > 0 && ` ${plural(waiting, 'change')} saved here will go up once the server can be reached.`}
        </p>
      ) : (
        <p className="muted small">
          {server.lastSyncAt ? `✅ Synced ${fmtAgo(server.lastSyncAt, now)}` : 'Waiting for the first sync…'}
          {waiting > 0 && ` · ${plural(waiting, 'change')} to send`}
        </p>
      )}
      {server.rejected && server.rejected.length > 0 && (
        <p className="notice notice-warn small">
          The server refused {plural(server.rejected.length, 'change')}: {server.rejected[0].reason} They stay on this phone and are
          sent again at each sync, so updating the server may fix it.
        </p>
      )}
      <button className="btn btn-small" style={{ alignSelf: 'flex-start' }} disabled={busy} onClick={() => void syncNow()}>
        {busy ? 'Syncing…' : '🔄 Sync now'}
      </button>
    </div>
  )
}
