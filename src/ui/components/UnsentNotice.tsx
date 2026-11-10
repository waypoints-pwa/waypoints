import { Link } from 'react-router'
import { m } from '../../i18n'
import { needsLinks, tripPath, useTrip } from '../tripData'

/** Nudge to send the group a link after changing things. Only for trips with company who use links. */
export function UnsentNotice() {
  const t = useTrip()
  if (!needsLinks(t)) return null
  return (
    <div className="notice notice-info notice-row" role="status">
      <span className="small">{m.share.unsentNotice(t.unsent)}</span>
      <Link className="btn btn-small btn-primary" to={tripPath(t.trip.id, 'share')}>
        {m.share.sendUpdate}
      </Link>
    </div>
  )
}
