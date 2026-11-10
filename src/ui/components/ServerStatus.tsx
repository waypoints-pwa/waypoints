import { useState } from 'react'
import { Link } from 'react-router'
import { runSync } from '../../sync/client'
import { m } from '../../i18n'
import { fmtAgo } from '../format'
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
        <p>{m.server.disconnected}</p>
        <Link className="btn btn-small" to="/server">
          {m.server.serverSettings}
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
          {m.server.couldntSync(server.lastSyncAt ? fmtAgo(server.lastSyncAt, now) : undefined, server.lastError)}
          {waiting > 0 && ` ${m.server.savedWillGoUp(waiting)}`}
        </p>
      ) : (
        <p className="muted small">
          {server.lastSyncAt ? m.server.synced(fmtAgo(server.lastSyncAt, now)) : m.server.waitingFirstSync}
          {waiting > 0 && ` · ${m.server.toSend(waiting)}`}
        </p>
      )}
      {server.rejected && server.rejected.length > 0 && (
        <p className="notice notice-warn small">
          {m.server.refused(server.rejected.length, server.rejected[0].reason)}
        </p>
      )}
      <button className="btn btn-small" style={{ alignSelf: 'flex-start' }} disabled={busy} onClick={() => void syncNow()}>
        {busy ? m.server.syncing : m.server.syncNow}
      </button>
    </div>
  )
}
