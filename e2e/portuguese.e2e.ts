import { expect, expectNoEnglish, test } from './fixtures.ts'

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

test('an unknown language stays English', async ({ page }) => {
  await page.goto('?lang=fr#/settings')
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()
})
