import { useState } from 'react'
import { useNavigate } from 'react-router'
import { importFile } from '../../db/backupIO'
import { DataError } from '../../domain/records'
import { tripRouteFrom } from '../../lib/tripLink'
import { BackLink, Notice } from '../components/bits'
import { mergeSummary, plural } from '../format'
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
    if (route) navigate(route)
    else setError("That isn't a waypoints trip link. Copy the whole link and try again.")
  }

  const onPaste = async () => {
    setError(undefined)
    try {
      const pasted = await navigator.clipboard.readText()
      setText(pasted)
      open(pasted)
    } catch {
      setError("Couldn't paste. Press and hold the box below and choose Paste.")
    }
  }

  const onFile = async (file: File | undefined) => {
    if (!file) return
    setError(undefined)
    setMessage(undefined)
    try {
      const { counts, trips } = await importFile(await file.text())
      if (trips.length === 1) navigate(tripPath(trips[0].id), { replace: true })
      else setMessage(`Opened ${plural(trips.length, 'trip')}: ${mergeSummary(counts)}.`)
    } catch (err) {
      setError(err instanceof DataError ? err.message : "That file couldn't be opened.")
    }
  }

  return (
    <>
      <BackLink to="/">Your trips</BackLink>
      <h2>Open a trip</h2>
      <p className="muted">Paste a trip link someone sent you, or open a waypoints file.</p>
      {canReadClipboard() && (
        <button className="btn btn-primary" onClick={() => void onPaste()}>
          📋 Paste trip link
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
          aria-label="Trip link"
        />
        <button className="btn" type="submit" disabled={!text.trim()}>
          Open link
        </button>
      </form>
      <label className="btn">
        📄 Open a file
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
