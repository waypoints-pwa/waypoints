import { setSetting, SETTINGS } from '../../db/db'
import { m } from '../../i18n'
import { useTrip } from '../tripData'

/** Shown on a trip this phone was taken off on the sync server, until dismissed. */
export function ServerGoneNotice() {
  const t = useTrip()
  if (!t.serverGone || t.server) return null
  return (
    <div className="notice notice-warn small" role="status">
      <p>{m.server.noLongerOnTrip}</p>
      <button className="btn btn-small" onClick={() => void setSetting(SETTINGS.serverGone(t.trip.id), undefined)}>
        {m.common.ok}
      </button>
    </div>
  )
}
