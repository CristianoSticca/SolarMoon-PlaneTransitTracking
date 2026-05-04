import { getRequestConfig } from 'next-intl/server'

const SUPPORTED_LOCALES = ['it', 'en'] as const
type Locale = typeof SUPPORTED_LOCALES[number]

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale
  if (!locale || !(SUPPORTED_LOCALES as readonly string[]).includes(locale)) {
    locale = 'it'
  }
  return {
    locale,
    messages: (await import(`./messages/${locale as Locale}.json`)).default,
  }
})
