import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import 'dayjs/locale/th';
import 'dayjs/locale/en';
import 'dayjs/locale/zh-cn';
import 'dayjs/locale/ms';
import 'dayjs/locale/tl-ph';
import { normalizeAppLanguage, type AppLanguage } from '../i18n';

const DAYJS_LOCALE: Record<AppLanguage, string> = {
  th: 'th',
  en: 'en',
  'zh-CN': 'zh-cn',
  ms: 'ms',
  fil: 'tl-ph',
};

export function I18nSync() {
  const { i18n, t } = useTranslation();

  useEffect(() => {
    const raw = i18n.resolvedLanguage || i18n.language;
    const lang = normalizeAppLanguage(raw);
    document.documentElement.lang = lang === 'zh-CN' ? 'zh-CN' : lang;
    document.title = t('app.title');
    const dj = DAYJS_LOCALE[lang] || 'en';
    dayjs.locale(dj);
  }, [i18n.language, i18n.resolvedLanguage, t]);

  return null;
}
