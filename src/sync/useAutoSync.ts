import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect } from 'react'
import { db } from '../db/db'
import { getServerConfig } from '../db/serverState'
import { runSync } from './client'

const PERIODIC_MS = 60_000
const DEBOUNCE_MS = 1500

// Failures are kept in the server config (shown in Settings); nothing to do here.
const syncQuietly = () => void runSync().catch(() => undefined)

/** Keeps trips on the server in sync while the app is open. Does nothing unless a server is connected. */
export function useAutoSync() {
  const connected = useLiveQuery(async () => {
    const cfg = await getServerConfig()
    return Boolean(cfg && cfg.lastErrorStatus !== 401)
  }, [])
  const waiting = useLiveQuery(() => db.outbox.count(), [])
  const trips = useLiveQuery(() => db.serverTrips.count(), [])

  useEffect(() => {
    if (!connected) return
    syncQuietly()
    const onVisible = () => document.visibilityState === 'visible' && syncQuietly()
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('online', syncQuietly)
    const timer = setInterval(() => document.visibilityState === 'visible' && syncQuietly(), PERIODIC_MS)
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('online', syncQuietly)
      clearInterval(timer)
    }
  }, [connected])

  // Send local edits, and trips just put on the server, shortly after they happen.
  useEffect(() => {
    if (!connected || (!waiting && !trips)) return
    const timer = setTimeout(syncQuietly, DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [connected, waiting, trips])
}

/** Renders nothing: runs the sync for the whole app. */
export function AutoSync() {
  useAutoSync()
  return null
}
