import { create } from 'zustand';
import en from '@/locales/en.json';
import fr from '@/locales/fr.json';

type Translations = typeof en;
type Locale = 'en' | 'fr';

const translations: Record<Locale, Translations> = {
  en,
  fr,
};

interface I18nStore {
  locale: Locale;
  t: (key: string, params?: Record<string, string>) => string;
  setLocale: (locale: Locale) => void;
}

export const useI18n = create<I18nStore>((set, get) => ({
  locale: 'en',

  t: (key: string, params?: Record<string, string>) => {
    const { locale } = get();
    const keys = key.split('.');
    let value: any = translations[locale];

    for (const k of keys) {
      value = value?.[k];
    }

    if (typeof value !== 'string') {
      console.warn(`Translation key not found: ${key}`);
      return key;
    }

    // Replace parameters
    if (params) {
      return Object.entries(params).reduce((acc, [paramKey, paramValue]) => {
        return acc.replace(`{{${paramKey}}}`, paramValue);
      }, value);
    }

    return value;
  },

  setLocale: (locale) => set({ locale }),
}));

// Helper hook
export function useTranslation() {
  const { t, locale, setLocale } = useI18n();
  return { t, locale, setLocale };
}
