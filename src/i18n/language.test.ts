import { describe, expect, it } from 'vitest'
import { languageFromSearch } from './language'

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
