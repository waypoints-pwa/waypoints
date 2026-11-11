import { useEffect, useState } from 'react'
import { SETTINGS } from '../../db/db'
import type { FoundAddress } from '../../domain/addresses'
import { airportCode, airportLabel, cityDetail, cityNamed, countryName, fold, searchAirports, searchCities } from '../../domain/places'
import { loadAirports, loadCities, searchAddressesOnline } from '../../lib/places'
import { languageTag, m } from '../../i18n'
import { useLoaded, useSetting } from '../hooks'
import { useTrip } from '../tripData'
import { Combobox, type Suggestion } from './Combobox'

/*
 * Fields for where things are, with suggestions: what the trip already has first, then the built-in
 * lists of cities and airports (offline), and for addresses an optional online search. Picking a
 * city or an airport also gives its time zone (`onZone`).
 */

const FROM_TRIP = 4
const FROM_LIST = 6

/** Whether a word in `text` starts with what's typed. Nothing typed matches everything. */
function matches(text: string, typed: string): boolean {
  const q = fold(typed)
  const f = fold(text)
  return !q || f.startsWith(q) || f.includes(` ${q}`)
}

type PlaceProps = { label?: string; value: string; onChange: (value: string) => void; onZone?: (zone: string) => void; placeholder?: string }

/** A city: the trip's own first, then the world's (towns of 15,000 people or more). */
export function CityField({ label = m.fields.city, value, onChange, onZone, placeholder }: PlaceProps) {
  const t = useTrip()
  const index = useLoaded(loadCities)
  const typed = value.trim()
  const zoneOf = (city: string) => t.cityZones.get(fold(city)) ?? (index && cityNamed(index, city)?.timeZone)
  const own = t.cities.filter((c) => matches(c, typed)).slice(0, FROM_TRIP)
  // A city the trip already has isn't listed twice, unless it's another of the same name.
  const ownZones = new Set(own.map((c) => `${fold(c)} ${zoneOf(c)}`))
  const world = index && typed ? searchCities(index, typed, FROM_LIST).filter((c) => !ownZones.has(`${fold(c.name)} ${c.timeZone}`)) : []
  const pick = (name: string, zone: string | undefined) => () => {
    onChange(name)
    if (zone) onZone?.(zone)
  }
  return (
    <Combobox
      label={label}
      value={value}
      onChange={onChange}
      maxLength={200}
      placeholder={placeholder}
      groups={[
        { label: m.fields.inThisTrip, items: own.map((c) => ({ key: c, label: c, onPick: pick(c, zoneOf(c)) })) },
        {
          label: m.fields.cities,
          items: world.map((c, i) => ({ key: `${i}`, label: c.name, detail: cityDetail(c, languageTag), onPick: pick(c.name, c.timeZone) })),
        },
      ]}
    />
  )
}

/** An airport: the trip's own first, then those with scheduled flights. Picked ones read "Lisbon (LIS)". */
export function AirportField({ label = m.fields.airport, value, onChange, onZone, placeholder }: PlaceProps) {
  const t = useTrip()
  const index = useLoaded(loadAirports)
  const typed = value.trim()
  const known = (text: string) => {
    const code = airportCode(text)
    return code ? index?.byCode.get(code) : undefined
  }
  const own = [...new Set(t.transports.filter((r) => r.mode === 'flight').flatMap((r) => [r.from, r.to]))]
    .filter((text) => matches(text, typed) || matches(known(text)?.name ?? '', typed))
    .slice(0, FROM_TRIP)
  const ownCodes = new Set(own.map(airportCode))
  const listed = index && typed ? searchAirports(index, typed, FROM_LIST).filter((a) => !ownCodes.has(a.code)) : []
  const pick = (text: string, zone: string | undefined) => () => {
    onChange(text)
    if (zone) onZone?.(zone)
  }
  return (
    <Combobox
      label={label}
      value={value}
      onChange={onChange}
      maxLength={200}
      placeholder={placeholder}
      autoCapitalize="words"
      groups={[
        {
          label: m.fields.inThisTrip,
          items: own.map((text) => ({ key: text, label: text, detail: known(text)?.name, onPick: pick(text, known(text)?.timeZone) })),
        },
        {
          label: m.fields.airports,
          items: listed.map((a) => ({
            key: a.code,
            label: airportLabel(a),
            detail: `${a.name}, ${countryName(a.country, languageTag)}`,
            onPick: pick(airportLabel(a), a.timeZone),
          })),
        },
      ]}
    />
  )
}

/** Where an address that was picked is: fills in the city (and its time zone) when that's empty. */
export interface PickedPlace {
  city: string
  zone?: string
}

type Search = { query: string; results?: FoundAddress[]; failed?: boolean }

/** Online search for what was typed, a moment after typing stops. */
function useOnlineSearch(query: string, city: string | undefined): Search | undefined {
  const [search, setSearch] = useState<Search>()
  useEffect(() => {
    if (query.length < 3) return
    const abort = new AbortController()
    const timer = setTimeout(() => {
      searchAddressesOnline(query, city, abort.signal)
        .then((results) => setSearch({ query, results }))
        .catch(() => abort.signal.aborted || setSearch({ query, failed: true }))
    }, 400)
    return () => {
      clearTimeout(timer)
      abort.abort()
    }
  }, [query, city])
  return query.length < 3 ? undefined : search
}

/**
 * An address: the trip's own (an activity at the hotel), and, for people who turned it on in
 * Settings, an online search (Photon, OpenStreetMap) as they type. Nothing is searched for an
 * address that was already there or picked: only for what someone types.
 */
export function AddressField({
  label = m.common.address,
  value,
  onChange,
  city,
  onPlace,
  placeholder,
}: {
  label?: string
  value: string
  onChange: (value: string) => void
  /** The item's city, to search near it. */
  city?: string
  onPlace?: (place: PickedPlace) => void
  placeholder?: string
}) {
  const t = useTrip()
  const online = useSetting<boolean>(SETTINGS.addressSearch)?.value === true
  const cities = useLoaded(loadCities)
  const [query, setQuery] = useState('')
  const typed = value.trim()
  const search = useOnlineSearch(online ? query.trim() : '', city?.trim() || undefined)
  const own = t.addresses.filter((a) => a.address !== typed && (matches(a.address, typed) || matches(a.what, typed))).slice(0, FROM_TRIP)
  const found = search?.results?.filter((r) => r.address !== typed && !own.some((a) => a.address === r.address)) ?? []

  const pick = (address: string, place: PickedPlace | undefined): Suggestion['onPick'] => () => {
    onChange(address)
    setQuery('')
    if (place) onPlace?.(place)
  }
  const zoneOf = (name: string, country?: string) => t.cityZones.get(fold(name)) ?? (cities && cityNamed(cities, name, country)?.timeZone)

  const searching = online && query.trim().length >= 3 && search?.query !== query.trim()
  const note = !online
    ? typed.length >= 3 && own.length === 0 && m.fields.turnOnInSettings
    : searching
      ? m.fields.searching
      : search?.failed
        ? m.fields.searchFailed
        : found.length > 0 && m.fields.foundByPhoton

  return (
    <Combobox
      label={label}
      value={value}
      onChange={(v) => {
        onChange(v)
        setQuery(v)
      }}
      maxLength={500}
      placeholder={placeholder}
      note={note || undefined}
      groups={[
        {
          label: m.fields.inThisTrip,
          items: own.map((a) => ({
            key: a.address,
            label: a.address,
            detail: a.what,
            onPick: pick(a.address, a.city ? { city: a.city, zone: a.timeZone ?? zoneOf(a.city) } : undefined),
          })),
        },
        {
          label: m.fields.foundOnline,
          items: found.map((r) => ({
            key: r.address,
            label: r.address,
            detail: r.country && countryName(r.country, languageTag),
            onPick: pick(r.address, r.city ? { city: r.city, zone: zoneOf(r.city, r.country) } : undefined),
          })),
        },
      ]}
    />
  )
}
