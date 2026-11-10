import { m } from '../../i18n'
import { LINKS } from '../../lib/links'

/** One quiet line asking for support; used on the trips list and in Settings → About. */
export function SupportLine({ className }: { className?: string }) {
  return (
    <p className={className ? `muted small ${className}` : 'muted small'}>
      {m.common.supportLine}{' '}
      <a className="link" href={LINKS.donate} target="_blank" rel="noreferrer">
        {m.common.supportOnKofi}
      </a>
    </p>
  )
}
