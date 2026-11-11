export const LANGUAGES = ['en', 'pt'] as const

export type Language = (typeof LANGUAGES)[number]

// The language asked for in the address (`?lang=pt`, before the `#`), if it is one we have.
export function languageFromSearch(search: string): Language | undefined {
  const lang = new URLSearchParams(search).get('lang')
  return LANGUAGES.find((known) => known === lang)
}

/** How each language is tagged for dates, numbers, country names and `<html lang>`. */
export const LANGUAGE_TAGS: Record<Language, string> = { en: 'en-GB', pt: 'pt-PT' }
/** Each language's name, written in that language (the same in both dictionaries). */
export const LANGUAGE_NAMES: Record<Language, string> = { en: 'English', pt: 'Português' }
/** Where Settings → Language keeps the choice (localStorage). Missing: Automatic. */
export const LANGUAGE_KEY = 'waypoints.language'

function baseOf(tag: string): string {
  return tag.toLowerCase().split('-')[0]
}

/** A saved choice, if it is a language we have ('en', 'pt'); anything else means Automatic. */
export function savedLanguage(value: string | null | undefined): Language | undefined {
  return LANGUAGES.find((known) => known === value)
}

/** The first of the phone's languages that we have, by its base ('pt-BR' → 'pt'), else English. */
export function phoneLanguage(phone: readonly string[]): Language {
  for (const tag of phone) {
    const found = LANGUAGES.find((known) => known === baseOf(tag))
    if (found) return found
  }
  return 'en'
}

/** The address (`?lang=`), else the saved choice, else the phone's language. */
export function pickLanguage(search: string, saved: string | null | undefined, phone: readonly string[]): Language {
  return languageFromSearch(search) ?? savedLanguage(saved) ?? phoneLanguage(phone)
}

/** The locale for dates and numbers: the phone's own (undefined) when its first language has the app's base, else the language's tag. */
export function formatLocale(language: Language, phone: readonly string[]): string | undefined {
  if (phone.length > 0 && baseOf(phone[0]) === language) return undefined
  return LANGUAGE_TAGS[language]
}
