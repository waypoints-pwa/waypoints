import type { StoredFile } from '../../db/types'
import { bestAndWorst, type ReportItem, type TripReport } from '../../domain/report'
import { useObjectUrl } from '../attachments'
import { m } from '../../i18n'
import { fmtDay, fmtDayRange, fmtDuration, fmtLongDay, fmtMoney, fmtMoneyShort } from '../format'
import { EXPENSE_CATEGORIES, labelOf, PLACE_CATEGORIES, STAY_KINDS, TRANSPORT_MODES } from '../labels'
import { Stars } from './Reviews'

/*
 * A trip report as it shows, prints and goes into a file. The shareable version is for anyone: no
 * names, notes or photos, and what it cost only when asked for. It leaves them out of the page
 * altogether (not just hidden), as the file is made from what's on the page. For the same reason the
 * full one says everyone's name, never "you": it's printed and sent as it is.
 */

interface Props {
  report: TripReport
  shareable: boolean
  /** In the shareable version: include what it cost. */
  costs: boolean
  /** This phone's photo files, by attachment id. */
  files?: Map<string, StoredFile>
}

export function ReportView({ report, shareable, costs, files }: Props) {
  const { trip, money, journeys } = report
  const showMoney = !shareable || costs
  const nights = report.stays.reduce((sum, s) => sum + s.nights, 0)
  const reviews = report.reviewed.reduce((sum, i) => sum + i.reviews.filter((r) => r.stars !== undefined).length, 0)
  const photos = shareable ? [] : report.photos.highlights.filter((id) => files?.get(id)?.thumb ?? files?.get(id)?.blob)
  const priciest = money.byDay.reduce<(typeof money.byDay)[number] | undefined>((top, d) => (!top || d.amount > top.amount ? d : top), undefined)
  const longest = journeys.longest

  return (
    <>
      <header className="report-head">
        <p className="report-emoji" aria-hidden>
          {trip.emoji ?? '🧳'}
        </p>
        <h2>{trip.name}</h2>
        <p className="muted">
          {fmtDayRange(trip.startDate, trip.endDate)} · {m.report.days(report.days)}
        </p>
        {report.cities.length > 0 && <p className="report-route">{report.cities.join(' → ')}</p>}
        <p className="muted small">{shareable ? m.report.travellers(report.travellers.length) : report.travellers.join(', ')}</p>
      </header>

      <section className="card">
        <h3>{m.report.inNumbers}</h3>
        <dl className="tiles">
          <Tile label={m.report.tileDays} value={report.days} />
          {report.cities.length > 0 && <Tile label={m.report.tileCities(report.cities.length)} value={report.cities.length} />}
          {nights > 0 && <Tile label={m.report.tileNights(nights)} value={nights} />}
          {report.activities > 0 && <Tile label={m.report.tileActivities(report.activities)} value={report.activities} />}
          {report.placesVisited > 0 && <Tile label={m.report.tilePlaces} value={report.placesVisited} />}
          {journeys.count > 0 && <Tile label={m.report.tileJourneys(journeys.count)} value={journeys.count} />}
          {journeys.minutes > 0 && <Tile label={m.report.tileTravelling} value={fmtDuration(journeys.minutes * 60_000)} />}
          {reviews > 0 && <Tile label={m.report.tileReviews(reviews)} value={reviews} />}
          {!shareable && report.photos.count > 0 && <Tile label={m.report.tilePhotos(report.photos.count)} value={report.photos.count} />}
          {showMoney && money.total > 0 && <Tile label={m.report.tileSpent} value={fmtMoneyShort(money.total, trip.currency)} />}
        </dl>
        <ul className="report-facts">
          {report.busiestDay && (
            <Fact emoji="📅">
              {m.report.busiestDay(fmtDay(report.busiestDay.day), report.busiestDay.count)}
            </Fact>
          )}
          {longest && (
            <Fact emoji={labelOf(TRANSPORT_MODES, longest.mode).emoji}>
              {m.report.longestJourney(longest.from, longest.to, fmtDuration(longest.minutes * 60_000))}
            </Fact>
          )}
          {showMoney && priciest && money.byDay.length > 1 && (
            <Fact emoji="💸">
              {m.report.priciestDay(fmtDay(priciest.day), fmtMoney(priciest.amount, trip.currency))}
            </Fact>
          )}
          {showMoney && money.biggestMeal && (
            <Fact emoji="🍽️">
              {m.report.priciestMeal(money.biggestMeal.title, fmtMoney(money.biggestMeal.amount, trip.currency))}
            </Fact>
          )}
          {showMoney && money.biggest && money.biggest.category !== 'food' && (
            <Fact emoji={labelOf(EXPENSE_CATEGORIES, money.biggest.category).emoji}>
              {m.report.biggestExpense(money.biggest.title, fmtMoney(money.biggest.amount, trip.currency))}
            </Fact>
          )}
        </ul>
      </section>

      {showMoney && <MoneySection report={report} shareable={shareable} />}
      <ReviewsSection report={report} shareable={shareable} />
      <StaysSection report={report} />
      {report.ideas.length > 0 && (
        <section className="card">
          <h3>{m.report.ideas}</h3>
          <p className="muted small">{m.report.ideasHint}</p>
          <ul className="report-list">
            {report.ideas.map((idea) => (
              <li key={idea.id}>
                <span className="list-emoji" aria-hidden>
                  {labelOf(PLACE_CATEGORIES, idea.category).emoji}
                </span>
                <span className="list-text">
                  <strong>{idea.name}</strong>
                  {idea.city && <span className="muted small">{idea.city}</span>}
                </span>
                {idea.mustSee && <span className="chip chip-must">{m.report.mustSee}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}
      {photos.length > 0 && (
        <section className="card">
          <h3>{m.report.photos}</h3>
          <div className="photo-grid">
            {photos.map((id) => (
              <ReportPhoto key={id} id={id} file={files!.get(id)!} />
            ))}
          </div>
        </section>
      )}
      <p className="report-foot muted small">{m.report.madeWith(fmtLongDay(report.madeAt.slice(0, 10)))}</p>
    </>
  )
}

function Tile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="tile-stat">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}

function Fact({ emoji, children }: { emoji: string; children: React.ReactNode }) {
  return (
    <li className="status-line">
      <span aria-hidden>{emoji}</span>
      <span>{children}</span>
    </li>
  )
}

function MoneySection({ report, shareable }: { report: TripReport; shareable: boolean }) {
  const { money } = report
  const cur = report.trip.currency
  const people = Math.max(1, report.travellers.length)
  return (
    <section className="card">
      <h3>{m.report.money}</h3>
      <div>
        <p className="big-number">{fmtMoney(money.total, cur)}</p>
        {money.total > 0 && (
          <p className="muted small">
            {m.report.perDay(fmtMoney(money.total / people / Math.max(1, report.days), cur), people > 1)}
          </p>
        )}
      </div>
      {money.byCategory.length > 0 && (
        <div className="bars">
          {money.byCategory.map(({ category, amount }) => {
            const label = labelOf(EXPENSE_CATEGORIES, category)
            return (
              <div key={category}>
                <div className="bar-label">
                  <span>
                    {label.emoji} {label.label}
                  </span>
                  <span className="money">{fmtMoney(amount, cur)}</span>
                </div>
                <div className="bar-track" aria-hidden>
                  <div className="bar-fill" style={{ width: `${money.total ? (amount / money.total) * 100 : 0}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      )}
      {money.byDay.length > 1 && <DayChart days={money.byDay} currency={cur} />}

      {!shareable && money.people.length > 1 && (
        <>
          <h4>{m.report.whoPaid}</h4>
          <ul className="history">
            {money.people.map((p) => (
              <li key={p.id}>
                <span>{p.name}</span>
                <span className="money small">
                  {m.report.paidTheirPart(fmtMoney(p.paid, cur), fmtMoney(p.share, cur))}
                </span>
              </li>
            ))}
          </ul>
          <h4>{m.report.settling}</h4>
          {money.toSettle.length ? (
            <ul className="history">
              {money.toSettle.map((p) => (
                <li key={`${p.from}-${p.to}`}>
                  <span>{m.report.paysTo(p.from, p.to)}</span>
                  <span className="money">{fmtMoney(p.amount, cur)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="small">{m.report.everyoneSquare}</p>
          )}
        </>
      )}
      {(money.uncounted > 0 || money.estimated > 0) && (
        <p className="muted small">
          {money.uncounted > 0 && m.report.uncounted(money.uncounted)}
          {money.uncounted > 0 && money.estimated > 0 && ' '}
          {money.estimated > 0 && m.report.estimated(money.estimated)}
        </p>
      )}
    </section>
  )
}

/** Spending by day: one column a day, the priciest labelled; the list below has every day's amount. */
function DayChart({ days, currency }: { days: { day: string; amount: number }[]; currency: string }) {
  const max = Math.max(...days.map((d) => d.amount))
  const top = days.find((d) => d.amount === max)
  const labelEvery = days.length <= 10 ? 1 : Math.ceil(days.length / 7)
  return (
    <div className="stack" style={{ gap: 6 }}>
      <h4>{m.report.byDay}</h4>
      <div className="day-chart" aria-hidden>
        {days.map((d) => (
          <div key={d.day} className="day-col" title={`${fmtDay(d.day)}: ${fmtMoney(d.amount, currency)}`}>
            {d === top && <span className="day-cap">{fmtMoney(d.amount, currency)}</span>}
            <div className="day-bar" style={{ height: `${max ? Math.max(2, (d.amount / max) * 100) : 0}%` }} />
          </div>
        ))}
      </div>
      <div className="day-axis" aria-hidden>
        {days.map((d, i) => (
          <span key={d.day}>{i % labelEvery === 0 ? Number(d.day.slice(8)) : ''}</span>
        ))}
      </div>
      <details>
        <summary className="small muted">{m.report.everyDay}</summary>
        <ul className="history">
          {days.map((d) => (
            <li key={d.day}>
              <span className="small">{fmtDay(d.day)}</span>
              <span className="money small">{fmtMoney(d.amount, currency)}</span>
            </li>
          ))}
        </ul>
      </details>
    </div>
  )
}

function ReviewsSection({ report, shareable }: { report: TripReport; shareable: boolean }) {
  const { best, worst, rest } = bestAndWorst(report.reviewed)
  return (
    <section className="card">
      <h3>{m.report.reviews}</h3>
      {report.reviewed.length === 0 && <p className="muted small">{m.report.nobodyReviewed}</p>}
      {best.length > 0 && (
        <>
          <h4>{m.report.bestOfTrip}</h4>
          <ReviewedList items={best} shareable={shareable} />
        </>
      )}
      {worst.length > 0 && (
        <>
          <h4>{m.report.notWorthIt}</h4>
          <ReviewedList items={worst} shareable={shareable} />
        </>
      )}
      {rest.length > 0 &&
        (best.length || worst.length ? (
          <details>
            <summary>{m.report.everythingElse(rest.length)}</summary>
            <ReviewedList items={rest} shareable={shareable} />
          </details>
        ) : (
          <ReviewedList items={rest} shareable={shareable} />
        ))}
    </section>
  )
}

const itemEmoji = (item: ReportItem) =>
  item.table === 'places'
    ? labelOf(PLACE_CATEGORIES, item.kind).emoji
    : item.table === 'stays'
      ? labelOf(STAY_KINDS, item.kind).emoji
      : item.table === 'transports'
        ? labelOf(TRANSPORT_MODES, item.kind).emoji
        : '🎟️'

function Average({ value }: { value?: number }) {
  if (value === undefined) return null
  const rounded = Math.round(value * 10) / 10
  return (
    <span className="stars" aria-label={m.reviews.averageStarsOf(rounded, 5)}>
      ★ <span className="stars-number">{rounded}</span>
    </span>
  )
}

function ReviewedList({ items, shareable }: { items: ReportItem[]; shareable: boolean }) {
  return (
    <ul className="report-list report-reviews">
      {items.map((item) => {
        const rated = item.reviews.filter((r) => r.stars !== undefined).length
        const missed = item.reviews.filter((r) => r.missed).length
        return (
          <li key={`${item.table}/${item.id}`}>
            <div className="row nowrap spread">
              <span className="row nowrap">
                <span className="list-emoji" aria-hidden>
                  {itemEmoji(item)}
                </span>
                <span className="list-text">
                  <strong>{item.title}</strong>
                  {(item.day || item.city) && <span className="muted small">{[item.day && fmtDay(item.day), item.city].filter(Boolean).join(' · ')}</span>}
                </span>
              </span>
              <Average value={item.average} />
            </div>
            {shareable ? (
              <p className="muted small">{[rated > 0 && m.report.reviewCount(rated), missed > 0 && m.report.didntGoCount(missed)].filter(Boolean).join(' · ')}</p>
            ) : (
              <ul className="review-list">
                {item.reviews.map((r) => (
                  <li key={r.by}>
                    <span className="row">
                      <strong>{r.name}</strong>
                      {r.missed ? <span className="muted small">{m.reviews.didntGoList}</span> : r.stars !== undefined && <Stars value={r.stars} />}
                    </span>
                    {r.note && <span className="prewrap small">{r.note}</span>}
                  </li>
                ))}
              </ul>
            )}
          </li>
        )
      })}
    </ul>
  )
}

function StaysSection({ report }: { report: TripReport }) {
  const { stays, journeys } = report
  if (!stays.length && !journeys.count) return null
  return (
    <section className="card">
      <h3>{m.report.staysJourneys}</h3>
      {stays.length > 0 && (
        <ul className="report-list">
          {stays.map((s) => (
            <li key={s.id}>
              <span className="list-emoji" aria-hidden>
                {labelOf(STAY_KINDS, s.kind).emoji}
              </span>
              <span className="list-text">
                <strong>{s.name}</strong>
                <span className="muted small">{[s.city, m.report.nights(s.nights)].filter(Boolean).join(' · ')}</span>
              </span>
              <Average value={s.average} />
            </li>
          ))}
        </ul>
      )}
      {journeys.count > 0 && (
        <>
          <p>
            {m.report.journeyCount(journeys.count)}
            {journeys.minutes > 0 && m.report.travelling(fmtDuration(journeys.minutes * 60_000))}
            {journeys.untimed > 0 && journeys.minutes > 0 && <span className="muted small">{m.report.withoutTimes(journeys.untimed)}</span>}
          </p>
          <div className="chips">
            {journeys.byMode.map(({ mode, count }) => {
              const label = labelOf(TRANSPORT_MODES, mode)
              return (
                <span key={mode} className="chip">
                  {label.emoji} {label.label}
                  {count > 1 && ` × ${count}`}
                </span>
              )
            })}
          </div>
        </>
      )}
    </section>
  )
}

function ReportPhoto({ id, file }: { id: string; file: StoredFile }) {
  const preview = file.thumb ?? file.blob
  const url = useObjectUrl(preview, `${id}:${file.thumb ? 'thumb' : 'full'}`)
  return <div className="tile">{url && <img src={url} alt="" data-photo={id} />}</div>
}
