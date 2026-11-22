import type { AppLocale } from '../ui-prefs';
import { en } from './en';
import { vi, type I18nKey } from './vi';

export type { I18nKey } from './vi';

export const SUPPORTED_LOCALES: readonly { code: AppLocale; label: string; nativeLabel: string }[] = [
  { code: 'vi', label: 'Vietnamese', nativeLabel: 'Tiếng Việt' },
  { code: 'en', label: 'English', nativeLabel: 'English' },
];

const CATALOGS: Record<AppLocale, Record<I18nKey, string>> = { vi, en };

export function translate(
  locale: AppLocale,
  key: I18nKey,
  params?: Record<string, string | number>,
): string {
  const dict = CATALOGS[locale] ?? vi;
  let text = dict[key] ?? vi[key] ?? key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replaceAll(`{${k}}`, String(v));
    }
  }
  return text;
}
