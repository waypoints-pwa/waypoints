export const LANGUAGES = ['en', 'pt'] as const

export type Language = (typeof LANGUAGES)[number]

// The language asked for in the address (`?lang=pt`, before the `#`), if it is one we have.
export function languageFromSearch(search: string): Language | undefined {
  const lang = new URLSearchParams(search).get('lang')
  return LANGUAGES.find((known) => known === lang)
}
