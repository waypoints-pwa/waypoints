import { describe, expect, it } from 'vitest'
import { formatLocale, languageFromSearch, phoneLanguage, pickLanguage, savedLanguage } from './language'

describe('languageFromSearch', () => {
  it('reads lang from the address, and only known languages count', () => {
    expect(languageFromSearch('')).toBeUndefined()
    expect(languageFromSearch('?lang=pt')).toBe('pt')
    expect(languageFromSearch('?lang=en')).toBe('en')
    expect(languageFromSearch('?x=1&lang=pt')).toBe('pt')
    expect(languageFromSearch('?lang=fr')).toBeUndefined()
    expect(languageFromSearch('?lang=PT')).toBeUndefined()
    expect(languageFromSearch('?lang=')).toBeUndefined()
    expect(languageFromSearch('?language=pt')).toBeUndefined()
  })
})

describe('phoneLanguage', () => {
  it('takes the first phone language the app has', () => {
    for (const phone of [['pt-PT'], ['pt-BR'], ['PT'], ['fr-FR', 'pt-PT']]) expect(phoneLanguage(phone)).toBe('pt')
    for (const phone of [['en-US'], ['fr-FR', 'de-DE'], []]) expect(phoneLanguage(phone)).toBe('en')
  })
})

describe('savedLanguage', () => {
  it('only knows our languages', () => {
    expect(savedLanguage('pt')).toBe('pt')
    for (const value of [null, '', 'auto', 'pt-PT']) expect(savedLanguage(value)).toBeUndefined()
  })
})

describe('pickLanguage', () => {
  it('prefers the address, then the saved choice, then the phone', () => {
    expect(pickLanguage('?lang=en', 'pt', ['pt-PT'])).toBe('en')
    expect(pickLanguage('', 'en', ['pt-PT'])).toBe('en')
    expect(pickLanguage('', null, ['pt-BR'])).toBe('pt')
    expect(pickLanguage('?lang=fr', 'x', ['de'])).toBe('en')
  })
})

describe('formatLocale', () => {
  it('follows the phone when it is in the app language, else the language tag', () => {
    expect(formatLocale('en', ['en-US'])).toBeUndefined()
    expect(formatLocale('pt', ['pt-BR'])).toBeUndefined()
    expect(formatLocale('en', ['pt-PT'])).toBe('en-GB')
    expect(formatLocale('pt', ['en-GB'])).toBe('pt-PT')
    expect(formatLocale('pt', [])).toBe('pt-PT')
  })
})

describe('i18n under Vitest', () => {
  it('is English with the phone formats', async () => {
    const i18n = await import('./index.ts')
    expect(i18n.language).toBe('en')
    expect(i18n.locale).toBeUndefined()
    expect(i18n.chosenLanguage).toBeUndefined()
  })
})
