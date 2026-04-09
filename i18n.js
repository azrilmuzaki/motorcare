import 'intl-pluralrules';

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import ar from './locales/ar.json';
import en from './locales/en.json';
import id from './locales/id.json';
import ja from './locales/ja.json';

const resources = {
  ar: { translation: ar },
  en: { translation: en },
  id: { translation: id },
  ja: { translation: ja },
};

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources,
    lng: 'id',
    fallbackLng: 'id',
    supportedLngs: ['id', 'en', 'ja', 'ar'],
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });
}

export default i18n;
