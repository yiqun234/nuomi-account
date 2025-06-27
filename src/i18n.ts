import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import Backend from 'i18next-http-backend'
import packageJson from '../package.json';

i18n
  // loads translations from your server
  .use(Backend)
  // detect user language
  .use(LanguageDetector)
  // pass the i18n instance to react-i18next.
  .use(initReactI18next)
  // init i18next
  .init({
    fallbackLng: 'en',
    debug: import.meta.env.DEV,
    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
    },
    backend: {
      // path to translation files
      loadPath: '/locales/{{lng}}/translation.json',
      queryStringParams: { v: packageJson.version }
    },
    detection: {
      // order and from where user language should be detected
      order: ['querystring', 'localStorage', 'navigator'],
      // param to lookup language from
      lookupQuerystring: 'lang',
      // cache user language on
      caches: ['localStorage'],
      // optional expire and domain for set cookie
      lookupLocalStorage: 'i18nextLng',
    },
    load: 'languageOnly'
  })

export default i18n 