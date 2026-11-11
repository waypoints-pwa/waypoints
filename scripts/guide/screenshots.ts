import { mkdirSync, mkdtempSync, utimesSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { chromium } from 'playwright'
import { demoBackup } from './demo-trip.ts'
import type { Language } from '../../src/i18n/language.ts'

/**
 * Makes the user guide's screenshots (docs/guide/*.png and docs/guide/pt/*.png) from the fictional demo trip.
 * Run `npm run dev`, then `npm run guide:screenshots` (both languages, or `-- en` / `-- pt` for one).
 * A fresh browser each time, so nothing carries over.
 */

const APP = 'http://localhost:5173'
const DOCS = join(import.meta.dirname, '..', '..', 'docs', 'guide')
const DURING = '2026-04-11T10:00:00+09:00'
const AFTER = '2026-04-20T10:00:00+01:00'

// The app's own words that this script clicks or waits for (it runs under plain Node, which can't load src/i18n).
const UI = {
  en: { gotIt: 'Got it', later: 'Later', whichOne: 'Which one are you?', addPhotos: 'Add photos', addDocuments: 'Add documents',
    add: 'Add', added4Photos: /^Added 4 photos/, added1Photo: /^Added 1 photo/, added1Document: /^Added 1 document/,
    addedPhotos: /^Added \d photos?/, allTrips: 'All trips', city: 'City', rates: /Exchange rates/, activities: 'Activities', select: 'Select' },
  pt: { gotIt: 'Percebi', later: 'Mais tarde', whichOne: 'Qual deles és tu?', addPhotos: 'Adicionar fotos', addDocuments: 'Adicionar documentos',
    add: 'Adicionar', added4Photos: /^Adicionadas 4 fotos/, added1Photo: /^Adicionada 1 foto/, added1Document: /^Adicionado 1 documento/,
    addedPhotos: /^Adicionadas? \d fotos?/, allTrips: 'Todas as viagens', city: 'Cidade', rates: /Taxas de câmbio/, activities: 'Atividades', select: 'Selecionar' },
}

const FILES = {
  en: { tripFile: 'japan-in-spring.json', insurance: 'travel-insurance.txt', eTicket: 'e-ticket.txt',
    insuranceText: 'Travel insurance: policy 123456. Call +351 000 000 000 in an emergency.\n',
    eTicketText: 'E-ticket: Lisbon to Tokyo. Show this at check-in.\n' },
  pt: { tripFile: 'japao-na-primavera.json', insurance: 'seguro-de-viagem.txt', eTicket: 'bilhete-eletronico.txt',
    insuranceText: 'Seguro de viagem: apólice 123456. Em caso de emergência, liga para +351 000 000 000.\n',
    eTicketText: 'Bilhete eletrónico: Lisboa para Tóquio. Mostra-o no check-in.\n' },
}

try {
  await fetch(APP)
} catch {
  console.error(`Can't reach ${APP}. Start the app first with "npm run dev", then run this again.`)
  process.exit(1)
}

const run = async (language: Language) => {
  const OUT = language === 'en' ? DOCS : join(DOCS, 'pt')
  const t = UI[language]
  const f = FILES[language]
  mkdirSync(OUT, { recursive: true })
  const tmp = mkdtempSync(join(tmpdir(), 'waypoints-guide-'))
  const backup = await demoBackup(language)
  const tripId = backup.trips[0].id
  const expenseTitle = backup.expenses.find((e) => e.amount === 41400)!.title
  const flightId = backup.transports[0].id
  const tripFile = join(tmp, f.tripFile)
  writeFileSync(tripFile, JSON.stringify(backup))

  const browser = await chromium.launch()
  // A phone-sized, light-theme, empty browser. Lisbon time, like the demo trip's travellers.
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    colorScheme: 'light',
    locale: language === 'en' ? 'en-GB' : 'pt-PT',
    timezoneId: 'Europe/Lisbon',
    acceptDownloads: false,
  })
  const page = await context.newPage()

  // Four coloured pages with an emoji, as JPEG photos for the trip.
  const photoFiles: string[] = []
  const scenes = [
    ['#ffd1dc', '🌸'],
    ['#c7e8f3', '🗼'],
    ['#d4edc9', '🍵'],
    ['#fde2b8', '⛩️'],
  ]
  const maker = await context.newPage()
  for (const [i, [colour, emoji]] of scenes.entries()) {
    await maker.setViewportSize({ width: 600, height: 450 })
    await maker.setContent(`<body style="margin:0;display:grid;place-items:center;height:100vh;background:${colour};font-size:180px">${emoji}</body>`)
    const file = join(tmp, `photo-${i + 1}.jpg`)
    await maker.screenshot({ path: file, type: 'jpeg', quality: 80 })
    // Photos are dated by the file, so they look taken on the trip.
    utimesSync(file, new Date(`2026-04-10T1${i}:00:00+09:00`), new Date(`2026-04-10T1${i}:00:00+09:00`))
    photoFiles.push(file)
  }
  await maker.close()

  const go = async (hash: string) => {
    await page.goto(`${APP}/#${hash}`)
    await page.reload()
    await page.waitForLoadState('networkidle')
    // Out of the way: a What's new card or an update banner would cover the screen.
    for (const name of [t.gotIt, t.later]) {
      const button = page.getByRole('button', { name, exact: true })
      if (await button.count()) await button.first().click()
    }
  }
  const shot = async (name: string) => {
    await page.waitForTimeout(400)
    await page.screenshot({ path: join(OUT, `${name}.png`) })
    console.log(`saved ${name}.png`)
  }

  await page.clock.setFixedTime(DURING)

  await go('/')
  await shot('welcome')

  // Import the demo trip through the normal file import.
  await go('/open')
  await page.locator('input[type=file]').setInputFiles(tripFile)
  await page.waitForURL(new RegExp(`/trips/${tripId}`))
  await page.waitForLoadState('networkidle')

  // This phone is Ana's.
  await go(`/trips/${tripId}/trip`)
  await page.getByLabel(t.whichOne).selectOption({ label: 'Ana' })

  // The photos.
  await go(`/trips/${tripId}/photos`)
  await page.locator('label', { hasText: t.addPhotos }).locator('input[type=file]').setInputFiles(photoFiles)
  await page.getByRole('button', { name: t.add, exact: true }).click()
  await page.getByText(t.added4Photos).waitFor()

  // A document for the whole trip.
  const insurance = join(tmp, f.insurance)
  writeFileSync(insurance, f.insuranceText)
  await page.locator('label', { hasText: t.addDocuments }).locator('input[type=file]').setInputFiles(insurance)
  await page.getByRole('button', { name: t.add, exact: true }).click()
  await page.getByText(t.added1Document).waitFor()

  // A photo and a document on the flight.
  const eTicket = join(tmp, f.eTicket)
  writeFileSync(eTicket, f.eTicketText)
  await go(`/trips/${tripId}/transport/${flightId}`)
  await page.locator('label', { hasText: t.addPhotos }).locator('input[type=file]').setInputFiles(photoFiles[0])
  await page.getByRole('button', { name: t.add, exact: true }).click()
  await page.getByText(t.added1Photo).waitFor()
  await page.locator('label', { hasText: t.addDocuments }).locator('input[type=file]').setInputFiles(eTicket)
  await page.getByRole('button', { name: t.add, exact: true }).click()
  await page.getByText(t.added1Document).waitFor()

  // Photos on two activities: Senso-ji gets two, teamLab one.
  for (const [activity, files] of [
    [backup.activities[0], [photoFiles[1], photoFiles[2]]],
    [backup.activities[1], [photoFiles[3]]],
  ] as const) {
    await go(`/trips/${tripId}/activities/${activity.id}`)
    await page.locator('label', { hasText: t.addPhotos }).locator('input[type=file]').setInputFiles([...files])
    await page.getByRole('button', { name: t.add, exact: true }).click()
    await page.getByText(t.addedPhotos).waitFor()
  }
  await go(`/trips/${tripId}/photos`)

  // In the app, not a reload: opening the app during a trip goes straight into it.
  await page.getByRole('link', { name: t.allTrips }).click()
  await page.waitForLoadState('networkidle')
  await shot('trips')
  await go('/new')
  await shot('new-trip')
  await go(`/trips/${tripId}`)
  await shot('plan-today')
  await go(`/trips/${tripId}?view=bookings`)
  await shot('bookings')
  await go(`/trips/${tripId}/transport/${flightId}`)
  await shot('flight')
  await go(`/trips/${tripId}/activities/new`)
  await page.getByLabel(t.city, { exact: true }).pressSequentially('Kyo', { delay: 80 })
  await page.getByRole('listbox').waitFor()
  await shot('city-search')
  await go(`/trips/${tripId}/places`)
  await shot('places')
  await go(`/trips/${tripId}/money`)
  await shot('money')
  await page.getByText(expenseTitle).first().click()
  await page.waitForLoadState('networkidle')
  await shot('expense')
  await go(`/trips/${tripId}/money`)
  await page
    .getByRole('heading', { name: t.rates })
    .evaluate((el) => el.scrollIntoView({ block: 'start' }))
  await shot('exchanges')
  await go(`/trips/${tripId}/photos`)
  await shot('documents')
  await go(`/trips/${tripId}/photos?view=photos`)
  // Scrolled to the Activities heading, so the item sections show.
  await page
    .getByRole('heading', { name: t.activities })
    .evaluate((el) => el.scrollIntoView({ block: 'start' }))
  await shot('photos')
  await page.evaluate('scrollTo(0, 0)')
  await page.getByRole('button', { name: t.select, exact: true }).click()
  await page.locator('button.tile').nth(0).click()
  await page.locator('button.tile').nth(1).click()
  await shot('select')
  await go(`/trips/${tripId}/share`)
  await shot('share')
  await go('/settings')
  await shot('settings')

  // After the trip.
  await page.clock.setFixedTime(AFTER)
  await go(`/trips/${tripId}/reviews`)
  await shot('reviews')
  await go(`/trips/${tripId}/report`)
  await shot('report')

  await browser.close()
}

const arg = process.argv[2]
const languages: Language[] = arg === 'en' || arg === 'pt' ? [arg] : ['en', 'pt']
for (const language of languages) await run(language)
