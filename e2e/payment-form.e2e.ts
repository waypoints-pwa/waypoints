import { dismissNotices, expect, importDemoTrip, pickMe, test } from './fixtures.ts'

test('a payment from the payee keeps the payee the form shows', async ({ page }) => {
  const backup = await importDemoTrip(page)
  const trip = backup.trips[0].id
  await pickMe(page, trip, 'Ana')
  await page.goto(`#/trips/${trip}/money`)
  await dismissNotices(page)
  await page.getByRole('link', { name: '+ Payment' }).click()

  // The demo travellers' order changes every run, so read the names off the form.
  const to = page.getByLabel('To')
  const payee = (await to.locator('option:checked').textContent())?.trim() ?? ''
  expect(payee).not.toBe('')
  await page.getByLabel('From').selectOption({ label: payee })
  const shown = (await to.locator('option:checked').textContent())?.trim() ?? ''
  expect(shown).not.toBe(payee)

  await page.getByRole('textbox', { name: 'Amount' }).fill('20')
  await page.getByRole('button', { name: 'Save' }).click()

  await expect(page.getByText('Choose who received the money.')).toHaveCount(0)
  await expect(page).not.toHaveURL(/\/expenses\/new/)
  await page.goto(`#/trips/${trip}/money`)
  await expect(page.getByText(`${payee} paid ${shown}`).first()).toBeVisible()
})
