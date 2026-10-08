import { useState } from 'react'

/**
 * iPhone links always open in Safari, whose storage is separate from the Home Screen app, so a trip
 * added here wouldn't show up there. Hand the link over by copy and paste instead.
 */
export function HandOff({ onStayHere }: { onStayHere: () => void }) {
  const [copied, setCopied] = useState<boolean>()
  const link = location.href

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  return (
    <section className="card">
      <button className="btn btn-primary" onClick={() => void copy()}>
        {copied ? '✓ Link copied' : 'Open in the waypoints app'}
      </button>
      {copied === undefined && (
        <p className="muted small">
          Safari keeps its own copy of waypoints, separate from the app on your Home Screen. This copies the link so you can open
          it there.
        </p>
      )}
      {copied === false && (
        <label className="field">
          <span>Copy this link</span>
          <input className="input" readOnly value={link} onFocus={(e) => e.currentTarget.select()} />
        </label>
      )}
      {copied !== undefined && (
        <>
          <ol className="steps">
            <li>Open waypoints from your Home Screen.</li>
            <li>
              Tap <strong>Open a trip link</strong> and then Paste.
            </li>
          </ol>
          <p className="muted small">No waypoints on your Home Screen yet? In Safari, tap Share → Add to Home Screen first.</p>
        </>
      )}
      <button className="link small" onClick={onStayHere}>
        Use it here in Safari instead
      </button>
    </section>
  )
}
