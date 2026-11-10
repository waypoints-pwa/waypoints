import { useState } from 'react'
import { m } from '../../i18n'

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
        {copied ? m.common.linkCopied : m.share.openInApp}
      </button>
      {copied === undefined && (
        <p className="muted small">
          {m.share.safariKeeps}
        </p>
      )}
      {copied === false && (
        <label className="field">
          <span>{m.share.copyThisLink}</span>
          <input className="input" readOnly value={link} onFocus={(e) => e.currentTarget.select()} />
        </label>
      )}
      {copied !== undefined && (
        <>
          <ol className="steps">
            <li>{m.share.openFromHomeScreen}</li>
            <li>{m.share.tapThenPaste(<strong>{m.share.handOffOpenTripLink}</strong>)}</li>
          </ol>
          <p className="muted small">{m.share.noWaypointsYet}</p>
        </>
      )}
      <button className="link small" onClick={onStayHere}>
        {m.share.useItHere}
      </button>
    </section>
  )
}
