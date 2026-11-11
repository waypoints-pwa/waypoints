import { en } from './en'
import type { Messages } from './en'
import { languageFromSearch } from './language'
import type { Language } from './language'
import { pt } from './pt'

export const language: Language = languageFromSearch(typeof location === 'undefined' ? '' : location.search) ?? 'en'
export const dictionaries: Record<Language, Messages> = { en, pt }
export const m: Messages = dictionaries[language]
