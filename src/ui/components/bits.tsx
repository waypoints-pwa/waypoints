import { useState, type ReactNode } from 'react'
import { Link } from 'react-router'

export function EmptyState({ children }: { children: ReactNode }) {
  return <div className="empty">{children}</div>
}

export function BackLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link className="link small back-link" to={to}>
      ← {children}
    </Link>
  )
}

export function DetailHead({ emoji, title, subtitle }: { emoji: string; title: string; subtitle?: ReactNode }) {
  return (
    <header className="detail-head">
      <span className="detail-emoji" aria-hidden>
        {emoji}
      </span>
      <div className="stack" style={{ gap: 2 }}>
        <h2>{title}</h2>
        {subtitle && <p className="muted">{subtitle}</p>}
      </div>
    </header>
  )
}

/** A booking reference: tap to copy it, for the check-in desk. */
export function CopyCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      prompt('Copy this:', code)
    }
  }
  return (
    <button type="button" className="code-chip" onClick={() => void copy()} aria-label={`Copy ${code}`}>
      {code} <span aria-hidden>{copied ? '✓' : '📋'}</span>
    </button>
  )
}

/** Opens outside the app (maps, booking sites, calendars). */
export function ExternalLink({ href, children, className = 'btn btn-small' }: { href: string; children: ReactNode; className?: string }) {
  return (
    <a className={className} href={href} target="_blank" rel="noreferrer noopener">
      {children}
    </a>
  )
}

export function Notice({ kind, children }: { kind: 'ok' | 'error' | 'warn' | 'info'; children: ReactNode }) {
  return (
    <div className={`notice notice-${kind}`} role={kind === 'error' ? 'alert' : 'status'}>
      {children}
    </div>
  )
}
