# Changelog

What's new in waypoints, newest first. This file is shown in the app (Settings → What's new).

<!--
Every user-facing change bumps "version" in package.json and adds an entry here (a test enforces it).
Heading: "## x.y.z — YYYY-MM-DD". Body: short paragraphs and "- " bullets; inline **bold** and `code`.
Write for people who use the app, not for developers.
-->

## 0.3.0 — 2026-10-09

An optional sync server: changes reach the group by themselves.

- **Sync server**: connect to a waypoints server (for example one on a home NAS) in Settings →
  **Sync server**. The trips you put on it reach everyone on it, and every change after that,
  without sending links. It's optional: everything works without it, as before.
- **Private trips**: a trip on the server is seen only by the people on it. Pick them from the
  server with a tap when you create the trip.
- **Mixed groups**: someone who isn't on the server is added by name, as before, and gets links.
  Changes they send you by link go up to the server too.
- **Put a trip on the server** later from the Trip tab. It keeps working the same, and links already
  sent still work.
- **Offline is fine**: changes made without signal wait on your phone and go up the next time the
  server can be reached.
- Joining is by invite from whoever runs the server. A trip you leave stays in its group, with your
  expenses.

## 0.2.0 — 2026-10-09

Card payments and paying back part of what you owe.

- **Cash or card**: an expense in another currency now says how it was paid. Cash converts at the
  rate your withdrawals got, as before. For a card, type what the bank charged.
- **Add the card cost later**: not in your bank app yet? Save the expense without it. It's marked
  **cost pending**, counts at your cash rate meanwhile, and the Money tab tells you how many are
  waiting (and which are yours).
- **Pay back part of it**: "Record payment" now opens the payment, filled in, so you can change the
  amount. Owe €100 and gave back €35? Record €35, and €65 stays owed. **+ Payment** in Balances
  records any other payment.

## 0.1.0 — 2026-10-08

The first version of waypoints: your trips in one place, on your phone, offline and without an account.

- **Trips** with the people going, the dates, a home time zone and the currency you count in.
- **Stays, transport and activities** with times in their own time zone, booking references,
  addresses, phone numbers and links. Tap to copy a booking reference, call the host, or get
  directions in Google or Apple Maps.
- **Day-by-day plan** that shows where you sleep each night and, during the trip, what's on today
  and what's next.
- **Places to see**, grouped by city, with must-sees, a visited tick and one tap to plan a visit.
- **Shared expenses** in any currency, split equally or by exact amounts, with balances and the
  fewest payments to settle up.
- **Exchange rates from your own money**: note a cash withdrawal or a money exchange once
  ("10,000 JPY for €62.50") and every expense in that currency is converted at the rate you actually
  got, fees included. Several exchanges are averaged, and a card payment can have its own rate.
- **Calendar export**: download the whole trip for Google or Apple Calendar, or add single items to
  Google Calendar.
- **Share with your group** as a link in your chat. Opening it adds the trip, or merges in everyone's
  changes. No server: the trip travels inside the link.
- **Backups**: save all your trips to a file and import them on another phone.
