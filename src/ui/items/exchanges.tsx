import { useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router'
import { deleteRecord, saveRecord } from '../../db/actions'
import type { Exchange } from '../../db/types'
import { parseAmount } from '../../domain/expenses'
import { isDay } from '../../domain/time'
import { CurrencySelect, Field, NotesField } from '../components/fields'
import { fmtPlain } from '../format'
import { useToday } from '../hooks'
import { tripPath, useTrip } from '../tripData'
import { ItemForm, ItemGone } from './common'
import { opt } from './save'

/** Money changed or withdrawn: sets the rate that expenses in that currency convert at. */
export function ExchangeFormPage() {
  const t = useTrip()
  const { itemId } = useParams()
  const [params] = useSearchParams()
  const existing = itemId ? t.exchanges.find((x) => x.id === itemId) : undefined
  if (itemId && !existing) return <ItemGone backTo={tripPath(t.trip.id, 'money')} />
  return <ExchangeForm key={itemId ?? 'new'} existing={existing} currency={params.get('currency')} />
}

function ExchangeForm({ existing, currency: asked }: { existing?: Exchange; currency: string | null }) {
  const t = useTrip()
  const { trip } = t
  const navigate = useNavigate()
  const today = useToday()
  const foreign = [...new Set([...t.expenses.map((e) => e.currency), ...t.exchanges.map((x) => x.currency)])].filter((c) => c !== trip.currency)
  const fallback = trip.currency === 'USD' ? 'EUR' : 'USD'
  const [currency, setCurrency] = useState(existing?.currency ?? (asked && /^[A-Z]{3}$/.test(asked) ? asked : (foreign[0] ?? fallback)))
  const [gotText, setGotText] = useState(existing ? fmtPlain(existing.amount) : '')
  const [costText, setCostText] = useState(existing ? fmtPlain(existing.cost) : '')
  const [date, setDate] = useState(existing?.date ?? today)
  const [by, setBy] = useState(existing?.by ?? t.me?.id ?? t.travellers[0]?.id ?? '')
  const [notes, setNotes] = useState(existing?.notes ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()

  const got = parseAmount(gotText)
  const cost = parseAmount(costText)
  const rate = got && cost ? got / cost : undefined
  // An exchange edited after the trip's currency changed keeps the currency it was paid in.
  const costCurrency = existing?.costCurrency ?? trip.currency

  const onSubmit = async () => {
    if (currency === costCurrency) return setError(`That's the trip's own currency. Choose the one you got.`)
    if (!got) return setError(`Enter how much ${currency} you got.`)
    if (!cost) return setError(`Enter what it cost in ${costCurrency}, fees included.`)
    if (!isDay(date)) return setError('Choose the day.')
    setBusy(true)
    try {
      await saveRecord('exchanges', trip.id, { date, currency, amount: got, cost, costCurrency, by: by || undefined, notes: opt(notes) }, existing?.id)
      navigate(tripPath(trip.id, 'money'), { replace: true })
    } finally {
      setBusy(false)
    }
  }

  const onDelete = async () => {
    if (!existing || !confirm(`Delete this exchange? Expenses in ${existing.currency} will convert without it.`)) return
    await deleteRecord('exchanges', existing.id)
    navigate(tripPath(trip.id, 'money'), { replace: true })
  }

  return (
    <ItemForm title={existing ? 'Edit exchange' : 'Money changed'} error={error} busy={busy} onSubmit={() => void onSubmit()}>
      <p className="muted small">
        Withdrew cash or changed money? Note what you got and what it cost, fees included. Every expense in that currency is then
        converted at that rate, and several exchanges are averaged.
      </p>
      <div className="field" role="group" aria-label="You got">
        <span>You got</span>
        <div className="row nowrap">
          <input className="input input-amount" inputMode="decimal" placeholder="10000" aria-label="Amount you got" value={gotText} autoFocus={!existing} onChange={(e) => setGotText(e.target.value)} />
          <CurrencySelect compact value={currency} onChange={setCurrency} suggestions={foreign} label="Currency you got" />
        </div>
      </div>
      <Field label={`It cost (${costCurrency}, fees included)`} hint={rate ? `1 ${costCurrency} = ${fmtPlain(rate, 4)} ${currency}` : undefined}>
        <input className="input" inputMode="decimal" placeholder="62.50" value={costText} onChange={(e) => setCostText(e.target.value)} />
      </Field>
      <Field label="Day">
        <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </Field>
      {t.travellers.length > 1 && (
        <Field label="Who">
          <select className="input" value={by} onChange={(e) => setBy(e.target.value)}>
            {t.travellers.map((x) => (
              <option key={x.id} value={x.id}>
                {x.name}
              </option>
            ))}
          </select>
        </Field>
      )}
      <NotesField value={notes} onChange={setNotes} placeholder="Airport cash machine, exchange office…" />
      {existing && (
        <button type="button" className="btn btn-danger" onClick={() => void onDelete()}>
          Delete exchange
        </button>
      )}
    </ItemForm>
  )
}
