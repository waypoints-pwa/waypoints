import { useState } from 'react'
import { useNavigate } from 'react-router'
import { importFile } from '../../db/backupIO'
import { DataError } from '../../domain/records'
import { tripRouteFrom } from '../../lib/tripLink'
import { BackLink, Notice } from '../components/bits'
import { m } from '../../i18n'
import { mergeSummary } from '../format'
import { tripPath } from '../tripData'

const canReadClipboard = () => typeof navigator.clipboard?.readText === 'function'

/**
 * Opens a trip link copied elsewhere, or a trip file. On iPhone, links always open in Safari, whose
 * storage is separate from the Home Screen app: this is how they get into the app.
 */
export function OpenPage() {
  const navigate = useNavigate()
  const [text, setText] = useState('')
  const [error, setError] = useState<string>()
  const [message, setMessage] = useState<string>()

  const open = (value: string) => {
    const route = tripRouteFrom(value)
    const invite = /#\/server\?(\S*invite=\S+)/.exec(value)
    if (route) navigate(route)
    else if (invite) navigate(`/server?${invite[1]}`)
    else setError(m.share.notATripLink)
  }

  const onPaste = async () => {
    setError(undefined)
    try {
      const pasted = await navigator.clipboard.readText()
      setText(pasted)
      open(pasted)
    } catch {
      setError(m.share.couldntPaste)
    }
  }

  const onFile = async (file: File | undefined) => {
    if (!file) return
    setError(undefined)
    setMessage(undefined)
    try {
      const { counts, trips } = await importFile(await file.text())
      if (trips.length === 1) navigate(tripPath(trips[0].id), { replace: true })
      else setMessage(m.share.openedTrips(trips.length, mergeSummary(counts)))
    } catch (err) {
      setError(err instanceof DataError ? err.message : m.share.fileCouldntBeOpened)
    }
  }

  return (
    <>
      <BackLink to="/">{m.common.yourTrips}</BackLink>
      <h2>{m.share.openATrip}</h2>
      <p className="muted">{m.share.openIntro}</p>
      {canReadClipboard() && (
        <button className="btn btn-primary" onClick={() => void onPaste()}>
          {m.share.pasteTripLink}
        </button>
      )}
      <form
        className="stack"
        onSubmit={(e) => {
          e.preventDefault()
          open(text)
        }}
      >
        <input
          className="input"
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            setError(undefined)
          }}
          placeholder="https://…/waypoints/#/t/…"
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          aria-label={m.share.tripLinkLabel}
        />
        <button className="btn" type="submit" disabled={!text.trim()}>
          {m.share.openLink}
        </button>
      </form>
      <label className="btn">
        {m.share.openAFile}
        <input
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(e) => {
            void onFile(e.target.files?.[0])
            e.target.value = ''
          }}
        />
      </label>
      {error && <Notice kind="error">{error}</Notice>}
      {message && <Notice kind="ok">{message}</Notice>}
    </>
  )
}
