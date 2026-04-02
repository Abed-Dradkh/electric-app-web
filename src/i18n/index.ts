import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { loadStoredLocale } from '../ui/localeStorage';
import ar from './locales/ar.json';
import en from './locales/en.json';

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ar: { translation: ar },
  },
  lng: loadStoredLocale() ?? 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18n;
