export type ColorSchemePreference = 'light' | 'dark' | 'system';

/** Keep in sync with the inline script in `index.html` (FOUC prevention). */
export const COLOR_SCHEME_PREFERENCE_STORAGE_KEY =
  'electric-app-color-scheme-preference';

function isColorSchemePreference(s: string): s is ColorSchemePreference {
  return s === 'light' || s === 'dark' || s === 'system';
}

export function loadStoredColorSchemePreference(): ColorSchemePreference | null {
  try {
    const v = localStorage.getItem(COLOR_SCHEME_PREFERENCE_STORAGE_KEY);
    if (v !== null && isColorSchemePreference(v)) {
      return v;
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function persistColorSchemePreference(
  preference: ColorSchemePreference,
): void {
  try {
    localStorage.setItem(COLOR_SCHEME_PREFERENCE_STORAGE_KEY, preference);
  } catch {
    /* ignore */
  }
}

export function resolveEffectiveColorScheme(
  preference: ColorSchemePreference,
  prefersDark: boolean,
): 'light' | 'dark' {
  if (preference === 'system') {
    return prefersDark ? 'dark' : 'light';
  }
  return preference;
}
