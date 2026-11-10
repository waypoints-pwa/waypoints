import { useEffect } from 'react'
import { m } from '../../i18n'
import { markReleasesSeen, RELEASES } from '../../lib/releases'
import { BackLink } from '../components/bits'
import { ReleaseNotes } from '../components/WhatsNew'

const formatDate = (date: string) => new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { dateStyle: 'medium' })

export function WhatsNewPage() {
  useEffect(() => {
    void markReleasesSeen()
  }, [])

  return (
    <>
      <BackLink to="/settings">{m.common.settings}</BackLink>
      <h2>{m.common.whatsNew}</h2>
      {RELEASES.map((release) => (
        <section key={release.version} className="card">
          <h3>
            waypoints {release.version} <span className="muted small">· {formatDate(release.date)}</span>
          </h3>
          <ReleaseNotes release={release} />
        </section>
      ))}
    </>
  )
}
