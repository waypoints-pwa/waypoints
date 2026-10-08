import { Link } from 'react-router'
import { plural } from '../format'
import { tripPath, useTrip } from '../tripData'

/** Nudge to send the group a link after changing things. Only for trips with company. */
export function UnsentNotice() {
  const t = useTrip()
  if (t.unsent === 0 || t.travellers.length < 2) return null
  return (
    <div className="notice notice-info notice-row" role="status">
      <span className="small">✏️ {plural(t.unsent, 'change')} the group hasn't seen yet.</span>
      <Link className="btn btn-small btn-primary" to={tripPath(t.trip.id, 'share')}>
        Send update
      </Link>
    </div>
  )
}
