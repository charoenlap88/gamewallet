import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import th from './locales/th.json';
import zhCN from './locales/zh-CN.json';
import ms from './locales/ms.json';
import fil from './locales/fil.json';

export const SUPPORTED_LANGUAGES = ['th', 'en', 'zh-CN', 'ms', 'fil'] as const;
export type AppLanguage = (typeof SUPPORTED_LANGUAGES)[number];

/** Emoji flag per UI language (for language switcher) */
export const LANGUAGE_FLAGS: Record<AppLanguage, string> = {
  th: '🇹🇭',
  en: '🇬🇧',
  'zh-CN': '🇨🇳',
  ms: '🇲🇾',
  fil: '🇵🇭',
};

export function normalizeAppLanguage(code: string): AppLanguage {
  if (code.startsWith('zh')) return 'zh-CN';
  if ((SUPPORTED_LANGUAGES as readonly string[]).includes(code)) return code as AppLanguage;
  return 'th';
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      th: { translation: th },
      'zh-CN': { translation: zhCN },
      ms: { translation: ms },
      fil: { translation: fil },
    },
    fallbackLng: 'th',
    supportedLngs: [...SUPPORTED_LANGUAGES],
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'gamewallet_lang',
    },
  });

export default i18n;
