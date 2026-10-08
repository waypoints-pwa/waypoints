import { useEffect, useState, useSyncExternalStore } from 'react'
import { applyUpdate, isUpdateReady, subscribeUpdate } from '../../lib/updates'

/** Asks before switching to a new version, so nothing being typed is lost. */
export function UpdateBanner() {
  const ready = useSyncExternalStore(subscribeUpdate, isUpdateReady)
  const [later, setLater] = useState(false)
  // Phones keep the app open in the background, so "Later" lasts until the user leaves and comes back.
  useEffect(() => {
    const reset = () => document.visibilityState === 'hidden' && setLater(false)
    document.addEventListener('visibilitychange', reset)
    return () => document.removeEventListener('visibilitychange', reset)
  }, [])
  if (!ready || later) return null
  return (
    <div className="update-banner" role="status">
      <span className="small">
        <strong>A new version of waypoints is ready.</strong> Reload when you've finished what you're doing.
      </span>
      <div className="row">
        <button className="btn btn-small btn-primary" onClick={() => void applyUpdate()}>
          Reload
        </button>
        <button className="btn btn-small btn-ghost" onClick={() => setLater(true)}>
          Later
        </button>
      </div>
    </div>
  )
}
