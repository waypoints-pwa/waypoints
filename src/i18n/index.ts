import { en } from './en'
import type { Messages } from './en'
import { LANGUAGE_KEY, LANGUAGE_TAGS, formatLocale, pickLanguage, savedLanguage } from './language'
import type { Language } from './language'
import { pt } from './pt'

// Only a browser has a phone language and a saved choice: tests (Node) are always English.
const inBrowser = typeof document !== 'undefined'
const phone: readonly string[] = inBrowser ? (navigator.languages?.length ? navigator.languages : [navigator.language]) : []

function readSaved(): string | null {
  try {
    return inBrowser ? localStorage.getItem(LANGUAGE_KEY) : null
  } catch {
    return null
  }
}

export const language: Language = pickLanguage(inBrowser ? location.search : '', readSaved(), phone)
/** For Intl and toLocale…: undefined keeps the phone's own formats (and tests' formats as they are). */
export const locale: string | undefined = inBrowser ? formatLocale(language, phone) : undefined
export const languageTag: string = LANGUAGE_TAGS[language]
/** What Settings → Language shows: the saved choice, or undefined for Automatic. */
export const chosenLanguage: Language | undefined = savedLanguage(readSaved())
export const dictionaries: Record<Language, Messages> = { en, pt }
export const m: Messages = dictionaries[language]

/** Saves Settings → Language (undefined: Automatic) and reloads, as the language is fixed at load. */
export function chooseLanguage(choice: Language | undefined) {
  try {
    if (choice) localStorage.setItem(LANGUAGE_KEY, choice)
    else localStorage.removeItem(LANGUAGE_KEY)
  } catch {
    // Not kept (private mode): the reload below goes back to Automatic.
  }
  location.reload()
}
