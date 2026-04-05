import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import {
  loadStoredColorSchemePreference,
  persistColorSchemePreference,
  resolveEffectiveColorScheme,
  type ColorSchemePreference,
} from './colorSchemePreferenceStorage';
import { ThemeContext, type ThemeContextValue } from './themeContext';

function subscribeToPrefersDark(callback: () => void): () => void {
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  mq.addEventListener('change', callback);
  return () => mq.removeEventListener('change', callback);
}

function getPrefersDarkSnapshot(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function getServerSnapshot(): boolean {
  return true;
}

function syncDocumentTheme(effective: 'light' | 'dark'): void {
  document.documentElement.dataset.colorScheme = effective;
  document.documentElement.style.colorScheme =
    effective === 'dark' ? 'dark' : 'light';

  let meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', 'theme-color');
    document.head.appendChild(meta);
  }
  meta.setAttribute(
    'content',
    effective === 'dark' ? '#050505' : '#e5dfd4',
  );
}

export function ThemeProvider({ children }: { readonly children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ColorSchemePreference>(
    () => loadStoredColorSchemePreference() ?? 'system',
  );

  const prefersDark = useSyncExternalStore(
    subscribeToPrefersDark,
    getPrefersDarkSnapshot,
    getServerSnapshot,
  );

  const effectiveScheme = useMemo(
    () => resolveEffectiveColorScheme(preference, prefersDark),
    [preference, prefersDark],
  );

  useLayoutEffect(() => {
    syncDocumentTheme(effectiveScheme);
  }, [effectiveScheme]);

  useEffect(() => {
    persistColorSchemePreference(preference);
  }, [preference]);

  const setPreference = useCallback((value: ColorSchemePreference) => {
    setPreferenceState(value);
  }, []);

  const value = useMemo(
    (): ThemeContextValue => ({
      preference,
      setPreference,
      effectiveScheme,
    }),
    [preference, setPreference, effectiveScheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
