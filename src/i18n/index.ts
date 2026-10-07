import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { defaultNS, resources } from './resources';

if (!i18n.isInitialized) {
  void i18n.use(initReactI18next).init({
    lng: 'en',
    fallbackLng: 'en',
    defaultNS,
    resources,
    interpolation: { escapeValue: false },
    initAsync: false,
  });
}

export { i18n };
