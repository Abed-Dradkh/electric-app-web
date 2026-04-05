import { createContext, useContext } from 'react';
import type { ColorSchemePreference } from './colorSchemePreferenceStorage';

export type ThemeContextValue = {
  readonly preference: ColorSchemePreference;
  readonly setPreference: (value: ColorSchemePreference) => void;
  readonly effectiveScheme: 'light' | 'dark';
};

export const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return ctx;
}
