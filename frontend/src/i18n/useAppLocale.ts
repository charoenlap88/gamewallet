import { useTranslation } from 'react-i18next';
import { normalizeAppLanguage, type AppLanguage } from './index';

/** locale สำหรับ toLocaleString / Intl */
const NUMBER_LOCALE: Record<AppLanguage, string> = {
  th: 'th-TH',
  en: 'en-US',
  'zh-CN': 'zh-CN',
  ms: 'ms-MY',
  fil: 'fil-PH',
};

export function useAppLocale(): string {
  const { i18n } = useTranslation();
  const key = normalizeAppLanguage(i18n.resolvedLanguage || i18n.language);
  return NUMBER_LOCALE[key];
}
