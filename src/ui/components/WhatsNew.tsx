import { Link } from 'react-router'
import { parseNotes, type Release } from '../../domain/changelog'
import { markReleasesSeen } from '../../lib/releases'
import { useUnseenReleases } from '../hooks'

function Inline({ text }: { text: string }) {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`)/).map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) return <strong key={i}>{part.slice(2, -2)}</strong>
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) return <code key={i}>{part.slice(1, -1)}</code>
    return part
  })
}

export function ReleaseNotes({ release }: { release: Release }) {
  return (
    <div className="release-notes">
      {parseNotes(release.body).map((block, i) =>
        block.kind === 'list' ? (
          <ul key={i}>
            {block.items.map((item, j) => (
              <li key={j}>
                <Inline text={item} />
              </li>
            ))}
          </ul>
        ) : (
          <p key={i}>
            <Inline text={block.text} />
          </p>
        ),
      )}
    </div>
  )
}

/** Shown once after an update, until dismissed. */
export function WhatsNewCard() {
  const unseen = useUnseenReleases()
  if (!unseen.length) return null
  const [latest, ...earlier] = unseen
  return (
    <section className="card whats-new">
      <div className="section-head">
        <h3>✨ New in waypoints {latest.version}</h3>
        <button className="btn btn-small btn-ghost" aria-label="Dismiss" onClick={() => void markReleasesSeen()}>
          ✕
        </button>
      </div>
      <ReleaseNotes release={latest} />
      <div className="row">
        <button className="btn btn-small btn-primary" onClick={() => void markReleasesSeen()}>
          Got it
        </button>
        <Link className="link small" to="/whats-new">
          {earlier.length ? `See ${earlier.length} earlier update${earlier.length > 1 ? 's' : ''}` : 'All updates'}
        </Link>
      </div>
    </section>
  )
}
