import type { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router'
import { deleteRecord } from '../../db/actions'
import { EmptyState } from '../components/bits'
import { FormError } from '../components/fields'
import { tripPath, useTrip } from '../tripData'
import { SEGMENT } from './save'

export function ItemForm({ title, error, busy, onSubmit, children }: { title: string; error?: string; busy: boolean; onSubmit: () => void; children: ReactNode }) {
  const navigate = useNavigate()
  return (
    <form
      className="form"
      noValidate
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit()
      }}
    >
      <h2>{title}</h2>
      {children}
      <FormError error={error} />
      <div className="form-actions">
        <button type="button" className="btn btn-ghost" onClick={() => navigate(-1)}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={busy}>
          Save
        </button>
      </div>
    </form>
  )
}

export function ItemFooter({ table, id, what, backTo }: { table: keyof typeof SEGMENT; id: string; what: string; backTo: string }) {
  const t = useTrip()
  const navigate = useNavigate()
  const onDelete = async () => {
    const others = t.travellers.length > 1 ? ' It will also be deleted for the others when you share the trip.' : ''
    if (!confirm(`Delete this ${what}?${others}`)) return
    await deleteRecord(table, id)
    navigate(backTo, { replace: true })
  }
  return (
    <div className="actions">
      <Link className="btn btn-primary" to={tripPath(t.trip.id, SEGMENT[table], id, 'edit')}>
        ✏️ Edit
      </Link>
      <button type="button" className="btn btn-danger" onClick={() => void onDelete()}>
        Delete
      </button>
    </div>
  )
}

export function ItemGone({ backTo }: { backTo: string }) {
  return (
    <EmptyState>
      <p className="big-emoji">🧭</p>
      <p>This isn't in the trip any more. Someone may have deleted it.</p>
      <Link className="btn" to={backTo}>
        Back
      </Link>
    </EmptyState>
  )
}
