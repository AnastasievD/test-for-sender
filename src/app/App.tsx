import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AppProviders } from './providers/AppProviders';
import { AppRouter } from './router';

const AppContent = () => {
  const { t, i18n } = useTranslation();

  useEffect(() => {
    document.documentElement.lang = i18n.resolvedLanguage ?? 'en';
    document.title = t('meta.title');
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute('content', t('meta.description'));
  }, [i18n.resolvedLanguage, t]);

  return <AppRouter />;
};

export const App = () => (
  <AppProviders>
    <AppContent />
  </AppProviders>
);
