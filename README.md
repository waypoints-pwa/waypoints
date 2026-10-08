# 📍 waypoints

A trip companion you install on your phone: the bookings, a day-by-day plan, the places you want to see
and the shared expenses of every trip, in one place. Works offline, needs **no account and no API keys**,
and never connects to a server of its own.

**Use it:** https://waypoints-pwa.github.io/waypoints/ → open it on your phone → *Add to Home Screen*.

## Features

- **Trips** with the people going, the dates, the time zone and the currency you count in.
- **Stays, transport and activities**: booking references (tap to copy at the desk), addresses, phone
  numbers and booking links. Times are kept in their own time zone, so overnight flights and trips across
  time zones come out right.
- **Day-by-day plan**: every day of the trip with where you sleep that night. During the trip it shows
  which day you're on, what's next, and directions to tonight's stay. A *Bookings* view lists every
  reservation with its reference.
- **Places to see**, grouped by city: must-sees, a visited tick, and one tap to put a place in the plan.
  Paste a Google or Apple Maps link to open it again later.
- **Shared expenses**, Splitwise-style: any currency, split equally or by exact amounts, with balances
  and the fewest payments to settle up.
- **Exchange rates from your own money**: note a cash withdrawal or a money exchange once ("10,000 JPY for
  €62.50") and every expense in that currency is converted at the rate you actually got, fees included.
  Several exchanges are averaged. Expenses paid by card can have their own rate.
- **Calendar export**: one `.ics` file with the whole trip for Google or Apple Calendar, or *Add to Google
  Calendar* for a single booking. Importing an updated file updates the events instead of copying them.
- **Share with your group** through any chat app, without a server (see below).
- **Backups**: export all trips to a file and import them on another phone. Safety copies are kept
  automatically before anything gets overwritten.

## Sharing a trip without a server

Everyone in the group keeps their own copy of the trip on their phone.

1. Tap 🔗 in a trip and send the link to your group chat. The whole trip travels inside the link, in the
   part after `#`, which browsers never send to a server.
2. Opening the link adds the trip. Each person says which traveller they are.
3. Anyone can add things (places, expenses…) and send a link back the same way. Opening it merges the
   changes into your copy, item by item: new things are added, the newest edit of each item wins, and
   deletions are passed on. Merging the same link twice changes nothing, and links can arrive in any order.

The app reminds you when you've changed things the group hasn't had yet. Trips with lots in them make long
links, which some chat apps cut short: you can send the trip as a file instead.

Anyone with a link can see everything in that trip, and a sent link can't be taken back.

## Privacy & data

Everything is stored in your browser (IndexedDB) on your phone. waypoints has no server, no accounts,
no analytics and no ads. The app is a static website: it makes no network requests of its own, which
its Content-Security-Policy enforces. Maps, calendars and booking sites are ordinary links that open in
their own apps when you tap them.

Browsers can clear website data when space runs low (especially on iPhone), so add the app to your Home
Screen and export a backup now and then.

## Updates & security

waypoints updates itself, like any website: a new version is picked up the next time it's opened, and your
trips are never touched by an update. All the code is public here, changes reach the app only through
pull requests that pass the automated tests, and every user-facing change is in the
[changelog](CHANGELOG.md) and in the app's *What's new*. Found a security problem? Please report it
privately, as described in [SECURITY.md](SECURITY.md).

## Development

```sh
npm install
npm run dev        # http://localhost:5173
npm test           # unit tests (Vitest)
npm run lint       # oxlint
npm run typecheck
npm run build      # production build into dist/
```

Stack: React + TypeScript + Vite, Dexie (IndexedDB), vite-plugin-pwa, React Router (hash routing, so deep
links work on GitHub Pages and trip links stay in the fragment). Pushes to `main` are tested and deployed to
GitHub Pages by [.github/workflows/deploy.yml](.github/workflows/deploy.yml).

```
src/
  domain/   pure logic: time zones, day-by-day plan, expenses and exchange rates, calendar export,
            link and backup formats, merging (unit-tested)
  db/       Dexie schema (append-only versions), write actions, backup import/export, snapshots
  lib/      browser helpers: trip link encoding, share sheet, app updates, downloads
  ui/       pages, item screens (one file per kind), components
```

## License

[MIT](LICENSE)
