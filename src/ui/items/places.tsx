import { useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router'
import { m } from '../../i18n'
import { patchRecord } from '../../db/actions'
import type { Place, PlaceCategory } from '../../db/types'
import { SETTINGS } from '../../db/db'
import { isGoogleMapsUrl } from '../../domain/googleMaps'
import { mapQuery, safeHttpUrl } from '../../domain/links'
import { rankByVotes, votesOf, wantLabel } from '../../domain/votes'
import { cityAt, reverseAddressOnline } from '../../lib/places'
import { GOOGLE_UNREACHABLE, lookUpGoogleMaps } from '../../sync/googleMaps'
import { DetailHead, EmptyState, Notice } from '../components/bits'
import { ChoiceChips, NotesField, TextField } from '../components/fields'
import { AddressField, CityField } from '../components/PlaceFields'
import { MapLinks, WebLink } from '../components/ItemLinks'
import { fmtDayTime } from '../format'
import { usable, useServer, useSetting } from '../hooks'
import { labelOf, PLACE_CATEGORIES } from '../labels'
import { tripPath, useTrip } from '../tripData'
import { AttachmentsCard } from '../components/Attachments'
import { ReviewsCard } from '../components/Reviews'
import { WantToGo } from '../components/Votes'
import { ItemFooter, ItemForm, ItemGone } from './common'
import { opt, useSave } from './save'

const NO_CITY = ''

export function PlacesPage() {
  const t = useTrip()
  const server = usable(useServer())
  const [params, setParams] = useSearchParams()
  const city = params.get('city')
  const category = params.get('category')
  const hideVisited = params.get('visited') === 'hide'
  const group = t.travellers.length > 1
  const wanted = group && params.get('sort') === 'wanted'
  const setFilter = (key: string, value: string | null) =>
    setParams(
      (p) => {
        if (value === null) p.delete(key)
        else p.set(key, value)
        return p
      },
      { replace: true },
    )

  const cityOf = (p: Place) => p.city?.trim() ?? NO_CITY
  // A category from a newer version of the app counts as "other".
  const categoryOf = (p: Place): PlaceCategory => (p.category in PLACE_CATEGORIES ? p.category : 'other')
  const cities = [...new Set(t.places.map(cityOf))].sort((a, b) => (a === NO_CITY ? 1 : b === NO_CITY ? -1 : a.localeCompare(b)))
  const categories = (Object.keys(PLACE_CATEGORIES) as PlaceCategory[]).filter((c) => t.places.some((p) => categoryOf(p) === c))
  const shown = t.places.filter(
    (p) => (city === null || cityOf(p) === city) && (category === null || categoryOf(p) === category) && !(hideVisited && p.visited),
  )
  const visited = t.places.filter((p) => p.visited).length

  return (
    <>
      <div className="section-head">
        <h2>
          {m.places.title} <span className="count">{t.places.length}</span>
        </h2>
        <div className="actions">
          {server && (
            <Link className="btn btn-small" to={tripPath(t.trip.id, 'places', 'import')}>
              {m.places.importList}
            </Link>
          )}
          <Link className="btn btn-small btn-primary" to={tripPath(t.trip.id, 'places', 'new')}>
            {m.places.addPlace}
          </Link>
        </div>
      </div>
      {t.places.length === 0 ? (
        <EmptyState>
          <p className="big-emoji">📍</p>
          <p>{m.places.emptyIntro}</p>
          <p className="muted small">{m.places.emptyHint}</p>
          {server && (
            <p className="muted small">
              {m.places.haveSharedList} <Link className="link" to={tripPath(t.trip.id, 'places', 'import')}>{m.places.importIt}</Link>
            </p>
          )}
        </EmptyState>
      ) : (
        <>
          {cities.length > 1 && (
            <div className="chips" aria-label={m.places.city}>
              <button className="toggle-chip" aria-pressed={city === null} onClick={() => setFilter('city', null)}>
                {m.places.allCities}
              </button>
              {cities.map((c) => (
                <button key={c} className="toggle-chip" aria-pressed={city === c} onClick={() => setFilter('city', city === c ? null : c)}>
                  {c || m.places.noCity}
                </button>
              ))}
            </div>
          )}
          {categories.length > 1 && (
            <div className="chips" aria-label={m.places.category}>
              {categories.map((c) => (
                <button key={c} className="toggle-chip" aria-pressed={category === c} onClick={() => setFilter('category', category === c ? null : c)}>
                  {PLACE_CATEGORIES[c].emoji} {PLACE_CATEGORIES[c].label}
                </button>
              ))}
            </div>
          )}
          {visited > 0 && (
            <label className="check small">
              <input type="checkbox" checked={hideVisited} onChange={(e) => setFilter('visited', e.target.checked ? 'hide' : null)} />
              <span>{m.places.hideVisited(visited)}</span>
            </label>
          )}
          {group && t.votes.length > 0 && (
            <div className="chips">
              <button className="toggle-chip" aria-pressed={wanted} onClick={() => setFilter('sort', wanted ? null : 'wanted')}>
                {m.places.mostWanted}
              </button>
            </div>
          )}
          {cities
            .filter((c) => shown.some((p) => cityOf(p) === c))
            .map((c) => (
              <section key={c}>
                {cities.length > 1 && <h3 className="group-title">{c || m.places.noCity}</h3>}
                <ul className="list">
                  {(() => {
                    const ordered = shown
                      .filter((p) => cityOf(p) === c)
                      .sort((a, b) => Number(Boolean(a.visited)) - Number(Boolean(b.visited)) || Number(Boolean(b.mustSee)) - Number(Boolean(a.mustSee)) || a.name.localeCompare(b.name))
                    return wanted ? rankByVotes(ordered, t.votes) : ordered
                  })().map((p) => (
                      <PlaceRow key={p.id} place={p} />
                    ))}
                </ul>
              </section>
            ))}
          {shown.length === 0 && <p className="muted">{m.places.noMatch}</p>}
        </>
      )}
    </>
  )
}

function PlaceRow({ place }: { place: Place }) {
  const t = useTrip()
  const category = labelOf(PLACE_CATEGORIES, place.category)
  const wants = t.travellers.length > 1 ? votesOf(t.votes, place.id).length : 0
  return (
    <li className={`list-row${place.visited ? ' done' : ''}`}>
      <Link to={tripPath(t.trip.id, 'places', place.id)} className="row-link">
        <span className="list-emoji" aria-hidden>
          {category.emoji}
        </span>
        <span className="list-text">
          <strong>{place.name}</strong>
          <span className="muted small">{[place.mustSee && m.places.mustSee, wants > 0 && wantLabel(wants), place.notes?.split('\n')[0] || place.address || category.label].filter(Boolean).join(' · ')}</span>
        </span>
      </Link>
      <WantToGo place={place} variant="row" />
      <button
        type="button"
        className="icon-btn"
        aria-pressed={Boolean(place.visited)}
        aria-label={place.visited ? m.places.markNotVisited(place.name) : m.places.markVisited(place.name)}
        onClick={() => void patchRecord('places', place.id, { visited: place.visited ? undefined : true })}
      >
        <span className="tick" aria-hidden>
          ✓
        </span>
      </button>
    </li>
  )
}

export function PlaceFormPage() {
  const t = useTrip()
  const { itemId } = useParams()
  const existing = itemId ? t.places.find((p) => p.id === itemId) : undefined
  if (itemId && !existing) return <ItemGone backTo={tripPath(t.trip.id, 'places')} />
  return <PlaceForm key={itemId ?? 'new'} existing={existing} />
}

function PlaceForm({ existing }: { existing?: Place }) {
  const [searchParams] = useSearchParams()
  const [name, setName] = useState(existing?.name ?? '')
  const [category, setCategory] = useState<string>(existing?.category ?? 'sight')
  const [city, setCity] = useState(existing?.city ?? searchParams.get('city') ?? '')
  const [address, setAddress] = useState(existing?.address ?? '')
  const [link, setLink] = useState(existing?.link ?? '')
  const [notes, setNotes] = useState(existing?.notes ?? '')
  const [mustSee, setMustSee] = useState(existing?.mustSee ?? false)
  const [lat, setLat] = useState(existing?.lat)
  const [lng, setLng] = useState(existing?.lng)
  const [pasted, setPasted] = useState('')
  const [looking, setLooking] = useState(false)
  const [lookupError, setLookupError] = useState<string>()
  const { save, busy, error, setError } = useSave('places', existing?.id)
  const server = usable(useServer())
  const onlineAddresses = useSetting<boolean>(SETTINGS.addressSearch)?.value === true

  const fillIn = async (input: string) => {
    const url = input.trim()
    if (!url || looking) return
    setLookupError(undefined)
    if (!safeHttpUrl(url) || !isGoogleMapsUrl(url)) return setLookupError(m.places.notAGoogleLink)
    setLooking(true)
    try {
      const answer = await lookUpGoogleMaps(url)
      if (answer.kind === 'list') return setLookupError(m.places.isAList)
      const { place } = answer
      setName(place.name)
      setLink(place.link)
      setLat(place.lat)
      setLng(place.lng)
      if (place.address) setAddress((a) => a || place.address!)
      else if (onlineAddresses) {
        const found = await reverseAddressOnline(place.lat, place.lng).catch(() => undefined)
        if (found) setAddress((a) => a || found)
      }
      const town = await cityAt(place.lat, place.lng).catch(() => undefined)
      if (town) setCity((c) => c || town)
    } catch (err) {
      const message = err instanceof Error ? err.message : GOOGLE_UNREACHABLE
      setLookupError(message)
      setLink((l) => l || url)
    } finally {
      setLooking(false)
    }
  }

  const onSubmit = () => {
    if (!name.trim()) return setError(m.places.giveName)
    if (link.trim() && !safeHttpUrl(link)) return setError(m.places.linkNotWeb)
    void save({
      name: name.trim(),
      category: category as PlaceCategory,
      city: opt(city),
      address: opt(address),
      link: opt(link),
      notes: opt(notes),
      mustSee: mustSee || undefined,
      visited: existing?.visited,
      lat,
      lng,
    })
  }

  return (
    <ItemForm title={existing ? m.places.editTitle : m.places.newTitle} error={error} busy={busy} onSubmit={onSubmit}>
      {!existing && server && (
        <div className="stack">
          <TextField
            label={m.places.pasteLink}
            type="url"
            value={pasted}
            onChange={setPasted}
            onPaste={(e) => {
              if (pasted.trim()) return
              const text = e.clipboardData.getData('text')
              setPasted(text)
              e.preventDefault()
              void fillIn(text)
            }}
            placeholder="https://maps.app.goo.gl/…"
            maxLength={2000}
            hint={m.places.pasteHint}
          />
          <button type="button" className="btn btn-small" style={{ alignSelf: 'flex-start' }} disabled={looking || !pasted.trim()} onClick={() => void fillIn(pasted)}>
            {m.places.fillIn}
          </button>
          {looking && <p className="muted small">{m.places.lookingItUp}</p>}
          {lookupError && <Notice kind="warn">{lookupError}</Notice>}
        </div>
      )}
      <TextField label={m.common.name} value={name} onChange={setName} placeholder={m.places.namePlaceholder} maxLength={200} autoFocus={!existing} />
      <ChoiceChips label={m.places.kind} options={PLACE_CATEGORIES} value={category} onChange={setCategory} />
      <CityField value={city} onChange={setCity} />
      <AddressField
        value={address}
        onChange={setAddress}
        city={city}
        onPlace={(p) => {
          if (!city.trim()) setCity(p.city)
        }}
      />
      <TextField
        label={m.common.link}
        type="url"
        value={link}
        onChange={setLink}
        placeholder="https://maps.app.goo.gl/…"
        maxLength={2000}
        hint={m.places.linkHint}
      />
      <NotesField value={notes} onChange={setNotes} placeholder={m.places.notesPlaceholder} />
      <label className="check">
        <input type="checkbox" checked={mustSee} onChange={(e) => setMustSee(e.target.checked)} />
        <span>
          {m.places.mustSee}
          <small>{m.places.shownFirst}</small>
        </span>
      </label>
    </ItemForm>
  )
}

export function PlacePage() {
  const t = useTrip()
  const { itemId } = useParams()
  const place = t.places.find((p) => p.id === itemId)
  const back = tripPath(t.trip.id, 'places')
  if (!place) return <ItemGone backTo={back} />
  const category = labelOf(PLACE_CATEGORIES, place.category)
  const visits = t.activities.filter((a) => a.placeId === place.id).sort((a, b) => a.date.localeCompare(b.date))
  const link = safeHttpUrl(place.link)
  const voters = t.travellers.length > 1 ? t.travellers.filter((x) => votesOf(t.votes, place.id).some((v) => v.by === x.id)).map((x) => x.name) : []
  return (
    <article className="stack">
      <DetailHead emoji={category.emoji} title={place.name} subtitle={[category.label, place.city].filter(Boolean).join(' · ')} />
      <div className="actions">
        <button type="button" className="toggle-chip" aria-pressed={Boolean(place.mustSee)} onClick={() => void patchRecord('places', place.id, { mustSee: place.mustSee ? undefined : true })}>
          {m.places.mustSee}
        </button>
        <button type="button" className="toggle-chip" aria-pressed={Boolean(place.visited)} onClick={() => void patchRecord('places', place.id, { visited: place.visited ? undefined : true })}>
          {m.places.beenThere}
        </button>
        <WantToGo place={place} variant="chip" />
      </div>
      {voters.length > 0 && (
        <p className="small">
          {wantLabel(voters.length)}: {voters.join(', ')}
        </p>
      )}
      <section className="card">
        {place.address && <p className="prewrap">{place.address}</p>}
        <div className="actions">
          {link && /maps|goo\.gl|maps\.apple/i.test(link) ? <WebLink url={link}>{m.places.openSavedMapLink}</WebLink> : <WebLink url={link}>{m.common.website}</WebLink>}
        </div>
        <MapLinks query={mapQuery(place.name, place.address ?? place.city)} />
      </section>
      {place.notes && (
        <section className="card">
          <h3>{m.common.notes}</h3>
          <p className="prewrap">{place.notes}</p>
        </section>
      )}
      <ReviewsCard target={{ table: 'places', record: place }} />
      <section className="card">
        <h3>{m.places.planAVisit}</h3>
        {visits.length > 0 && (
          <ul className="list">
            {visits.map((a) => (
              <li key={a.id}>
                <Link className="link" to={tripPath(t.trip.id, 'activities', a.id)}>
                  🎟️ {fmtDayTime(a.date, a.startTime)}
                </Link>
              </li>
            ))}
          </ul>
        )}
        <Link className="btn btn-small" style={{ alignSelf: 'flex-start' }} to={`${tripPath(t.trip.id, 'activities', 'new')}?place=${place.id}`}>
          {m.places.addToPlan}
        </Link>
      </section>
      <AttachmentsCard table="places" id={place.id} />
      <ItemFooter table="places" id={place.id} what="place" backTo={back} />
    </article>
  )
}
