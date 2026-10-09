import { setSetting, SETTINGS } from '../../db/db'
import { useTrip } from '../tripData'

/** Shown on a trip this phone was taken off on the sync server, until dismissed. */
export function ServerGoneNotice() {
  const t = useTrip()
  if (!t.serverGone || t.server) return null
  return (
    <div className="notice notice-warn small" role="status">
      <p>
        You're no longer on this trip on the sync server: someone took you off it, or you were removed from the server. Your copy
        stays on this phone, and links still bring you the group's changes.
      </p>
      <button className="btn btn-small" onClick={() => void setSetting(SETTINGS.serverGone(t.trip.id), undefined)}>
        OK
      </button>
    </div>
  )
}
