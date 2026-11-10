import { expect, expectNoEnglish, importDemoTrip, test } from './fixtures.ts'

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
  await expect(page.getByText('Relatório completo')).toBeVisible()
  await expect(page.getByText('Para partilhar')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'A viagem em números' })).toBeVisible()
})

test('an unknown language stays English', async ({ page }) => {
  await page.goto('?lang=fr#/settings')
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()
})
