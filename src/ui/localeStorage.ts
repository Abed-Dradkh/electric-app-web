const STORAGE_KEY = 'electric-app-locale';

export type AppLocale = 'en' | 'ar';

export function isAppLocale(s: string): s is AppLocale {
  return s === 'en' || s === 'ar';
}

export function loadStoredLocale(): AppLocale | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v !== null && isAppLocale(v)) {
      return v;
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function persistLocale(locale: AppLocale): void {
  try {
    localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    /* ignore */
  }
}
