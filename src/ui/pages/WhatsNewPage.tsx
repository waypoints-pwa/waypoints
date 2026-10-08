import { useEffect } from 'react'
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
      <BackLink to="/settings">Settings</BackLink>
      <h2>What's new</h2>
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
