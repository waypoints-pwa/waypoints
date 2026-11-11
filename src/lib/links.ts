import type { Language } from '../i18n/language.ts'

/** External links shown in the app. Change them here only. */
export const LINKS = {
  app: 'https://waypoints-pwa.github.io/waypoints/',
  github: 'https://github.com/waypoints-pwa/waypoints',
  guide: 'https://github.com/waypoints-pwa/waypoints/blob/main/GUIDE.md',
  guidePt: 'https://github.com/waypoints-pwa/waypoints/blob/main/GUIDE.pt.md',
  donate: 'https://ko-fi.com/ricardoalmeida59690',
} as const

/** The user guide in the app's language. */
export const guideFor = (language: Language) => (language === 'pt' ? LINKS.guidePt : LINKS.guide)
