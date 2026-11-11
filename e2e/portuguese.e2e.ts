import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { Page } from '@playwright/test'
import { LINKS } from '../src/lib/links.ts'
import { expect, expectNoEnglish, importDemoTrip, test } from './fixtures.ts'

/** Makes a phone ready: no share sheet (so the app copies the link), clipboard allowed. */
async function setUp(page: Page) {
  await page.context().addInitScript(() => {
    Object.defineProperty(navigator, 'share', { value: undefined, configurable: true })
  })
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write'], { origin: 'http://localhost:4173' })
}

test('?lang=pt shows the Welcome screen in Portuguese', async ({ page }) => {
  await page.goto('?lang=pt')
  await expect(page.getByRole('heading', { name: 'Planear uma viagem' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Ler o guia' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Definições' })).toBeVisible()
  await expectNoEnglish(page)
})

test('?lang=pt shows Settings and the "nothing here" page in Portuguese', async ({ page }) => {
  await page.goto('?lang=pt#/settings')
  await expect(page.getByRole('heading', { name: 'Definições' })).toBeVisible()
  await expectNoEnglish(page)

  await page.goto('?lang=pt#/nowhere')
  await expect(page.getByText('Não há nada aqui.')).toBeVisible()
  await expect(page.getByRole('link', { name: 'As tuas viagens' })).toBeVisible()
})

test('?lang=pt shows the trip, its forms, packing and Trip tab in Portuguese', async ({ page }) => {
  const backup = await importDemoTrip(page)
  const id = backup.trips[0].id

  await page.goto(`?lang=pt#/trips/${id}`)
  const tabs = page.locator('nav.tabbar')
  for (const name of ['Plano', 'Locais', 'Dinheiro', 'Ficheiros', 'Viagem']) {
    await expect(tabs.getByRole('link', { name })).toBeVisible()
  }
  await expect(page.getByRole('link', { name: 'Todas as viagens' })).toHaveCount(1)

  await page.goto(`?lang=pt#/trips/${id}/stays/new`)
  await expect(page.getByRole('heading', { name: 'Nova estadia' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Guardar' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Cancelar' })).toBeVisible()
  await expectNoEnglish(page)

  await page.goto(`?lang=pt#/trips/${id}/transport/new`)
  await expect(page.getByRole('heading', { name: 'Novo trajeto' })).toBeVisible()
  await expectNoEnglish(page)

  await page.goto(`?lang=pt#/trips/${id}/activities/new`)
  await expect(page.getByRole('heading', { name: 'Nova atividade' })).toBeVisible()

  await page.goto(`?lang=pt#/trips/${id}/places/new`)
  await expect(page.getByRole('heading', { name: 'Novo local' })).toBeVisible()

  await page.goto(`?lang=pt#/trips/${id}/packing`)
  await expect(page.getByRole('heading', { name: 'Bagagem e tarefas' })).toBeVisible()

  await page.goto(`?lang=pt#/trips/${id}/trip`)
  await expect(page.getByRole('heading', { name: 'Quem vai' })).toBeVisible()
})

test('?lang=pt shows Money, Files, Reviews and the report in Portuguese', async ({ page }) => {
  const backup = await importDemoTrip(page)
  const id = backup.trips[0].id

  await page.goto(`?lang=pt#/trips/${id}/money`)
  await expect(page.getByRole('heading', { name: 'Despesas' })).toBeVisible()

  await page.goto(`?lang=pt#/trips/${id}/expenses/new`)
  await expect(page.getByRole('heading', { name: 'Nova despesa' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Guardar' })).toBeVisible()

  await page.goto(`?lang=pt#/trips/${id}/expenses/new?transfer=1`)
  await expect(page.getByRole('heading', { name: 'Novo pagamento' })).toBeVisible()

  await page.goto(`?lang=pt#/trips/${id}/exchanges/new`)
  await expect(page.getByRole('heading', { name: 'Novo câmbio' })).toBeVisible()

  await page.goto(`?lang=pt#/trips/${id}/photos`)
  await expect(page.getByRole('heading', { name: 'Ficheiros' })).toBeVisible()
  await expect(page.getByRole('tab', { name: 'Documentos' })).toBeVisible()
  await expect(page.getByRole('tab', { name: 'Fotos' })).toBeVisible()
  await expectNoEnglish(page)

  await page.goto(`?lang=pt#/trips/${id}/reviews`)
  await expect(page.getByRole('heading', { name: 'Avaliações' })).toBeVisible()

  await page.goto(`?lang=pt#/trips/${id}/report`)
  await expect(page.getByRole('heading', { name: 'Relatório da viagem' })).toBeVisible()
  await expect(page.getByRole('tab', { name: 'Relatório completo' })).toBeVisible()
  await expect(page.getByRole('tab', { name: 'Para partilhar' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'A viagem em números' })).toBeVisible()
})

test('?lang=pt shows Open, the Sync server page and file selection in Portuguese', async ({ page }) => {
  const backup = await importDemoTrip(page)
  const id = backup.trips[0].id

  await page.goto('?lang=pt#/open')
  await expect(page.getByRole('heading', { name: 'Abrir uma viagem' })).toBeVisible()
  await expectNoEnglish(page)

  await page.goto('?lang=pt#/server')
  await expect(page.getByRole('heading', { name: 'Servidor de sincronização' })).toBeVisible()
  await expect(page.getByText('Tenho um convite')).toBeVisible()
  await expect(page.getByText('O servidor é meu')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Ligar', exact: true })).toBeVisible()
  await expectNoEnglish(page)

  await page.goto(`?lang=pt#/trips/${id}/server`)
  await expect(page.getByText('Liga primeiro este telemóvel a um servidor de sincronização.')).toBeVisible()

  await page.goto(`?lang=pt#/trips/${id}/photos`)
  const file = join(mkdtempSync(join(tmpdir(), 'waypoints-smoke-')), 'note.txt')
  writeFileSync(file, 'a small note')
  await page.locator('label', { hasText: 'Adicionar documentos' }).locator('input[type=file]').setInputFiles(file)
  await page.getByRole('button', { name: 'Adicionar', exact: true }).click()
  await page.getByRole('button', { name: 'Selecionar', exact: true }).click()
  await expect(page.getByText('0 selecionados')).toBeVisible()
  for (const name of ['Selecionar tudo', 'Eliminar', 'Cancelar']) {
    await expect(page.getByRole('button', { name, exact: true })).toBeInViewport({ ratio: 1 })
  }
})

test('?lang=pt shows sharing a trip and opening its link in Portuguese', async ({ page, newPhone }) => {
  const other = await newPhone()
  await setUp(page)
  await setUp(other)
  const backup = await importDemoTrip(page)
  const id = backup.trips[0].id

  await page.goto(`?lang=pt#/trips/${id}/share`)
  await expect(page.getByRole('heading', { name: 'Partilhar com o grupo' })).toBeVisible()
  await expectNoEnglish(page)
  await page.getByRole('button', { name: '🔗 Partilhar link da viagem' }).click()
  await expect(page.getByText('✓ Link copiado')).toBeVisible()
  const link = await page.evaluate<string>('navigator.clipboard.readText()')

  await other.goto(link.replace('#/t/', '?lang=pt#/t/'))
  await other.getByRole('button', { name: '+ Adicionar às minhas viagens' }).click()
  await expect(other.getByText('Qual deles és tu?')).toBeVisible()
  await expect(other.getByRole('button', { name: 'Agora não' })).toBeVisible()
})

test('?lang=pt shows why things failed and the packing templates in Portuguese', async ({ page }) => {
  await page.goto('?lang=pt#/t/not-a-real-link')
  await expect(page.getByText('Este link está incompleto.')).toBeVisible()

  await page.goto('?lang=pt#/open')
  const file = join(mkdtempSync(join(tmpdir(), 'waypoints-smoke-')), 'not-a-trip.json')
  writeFileSync(file, 'hello')
  await page.locator('input[type=file]').setInputFiles(file)
  await expect(page.getByText('Este ficheiro não é do waypoints.')).toBeVisible()

  await page.goto('?lang=pt#/server')
  await page.getByText('O servidor é meu').click()
  await page.getByLabel('Endereço do servidor').fill('http://example.com')
  await page.getByLabel('Código do servidor').fill('AAAA-BBBB-CCCC')
  await page.getByRole('button', { name: 'Continuar', exact: true }).click()
  await expect(page.getByText('O endereço do servidor tem de começar por https://')).toBeVisible()

  const backup = await importDemoTrip(page)
  const id = backup.trips[0].id
  await page.goto(`?lang=pt#/trips/${id}/packing`)
  await page.getByRole('button', { name: 'Praia', exact: true }).click()
  await expect(page.getByText('Protetor solar')).toBeVisible()
  await expect(page.getByText('0 de 10 na mala')).toBeVisible()

  await page.goto(`#/trips/${id}/packing`)
  await expect(page.getByText('0 of 10 packed')).toBeVisible()
  await page.getByRole('button', { name: 'Beach', exact: true }).click()
  await expect(page.getByText('0 of 10 packed')).toBeVisible()
  await expect(page.getByText('Sunscreen')).toHaveCount(0)
})

test('?lang=pt links the guide in Portuguese', async ({ page }) => {
  await page.goto('?lang=pt')
  await expect(page.getByRole('link', { name: 'Ler o guia' })).toHaveAttribute('href', LINKS.guidePt)
  await page.goto('?lang=pt#/settings')
  await expect(page.getByRole('link', { name: 'Como usar o waypoints' })).toHaveAttribute('href', LINKS.guidePt)
})

test('exchange rates follow the number style of the language', async ({ page }) => {
  const backup = await importDemoTrip(page)
  const id = backup.trips[0].id
  await page.goto(`?lang=pt#/trips/${id}/money`)
  await expect(page.locator('main')).toContainText('1 EUR = 162,6016 JPY')
  await page.goto(`#/trips/${id}/money`)
  await expect(page.locator('main')).toContainText('1 EUR = 162.6016 JPY')
})

test('an unknown language stays English', async ({ page }) => {
  await page.goto('?lang=fr#/settings')
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()
})

test.describe('a phone in Portuguese', () => {
  test.use({ locale: 'pt-PT' })

  test('gets Portuguese with no ?lang, dates in its style, and can pick another language', async ({ page }) => {
    await page.goto('')
    await expect(page.getByRole('heading', { name: 'Planear uma viagem' })).toBeVisible()
    await expectNoEnglish(page)
    await expect(page.locator('html')).toHaveAttribute('lang', 'pt-PT')

    await importDemoTrip(page)
    await page.goto('')
    await expect(page.locator('main')).toContainText('08/04/2026')

    await page.goto('#/settings')
    const reloaded = page.waitForEvent('load')
    await page.getByLabel('Idioma').selectOption({ label: 'English' })
    await reloaded
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()
    await page.goto('')
    await expect(page.locator('main')).toContainText('Apr 2026')
    await page.reload()
    await expect(page.locator('main')).toContainText('Apr 2026')
    await expect(page.locator('html')).toHaveAttribute('lang', 'en-GB')

    await page.goto('#/settings')
    const back = page.waitForEvent('load')
    await page.getByLabel('Language').selectOption({ label: "Automatic (phone's language)" })
    await back
    await expect(page.getByRole('heading', { name: 'Definições' })).toBeVisible()
  })
})

test('an English phone can pick Português, and What\'s new follows', async ({ page }) => {
  await page.goto('#/settings')
  const reloaded = page.waitForEvent('load')
  await page.getByLabel('Language').selectOption({ label: 'Português' })
  await reloaded
  await expect(page.getByRole('heading', { name: 'Definições' })).toBeVisible()

  await page.goto('#/whats-new')
  await expect(page.getByRole('heading', { name: 'Novidades' })).toBeVisible()
  await expectNoEnglish(page)
})
