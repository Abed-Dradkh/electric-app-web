import type { SupplyKind } from '../model/supplyKind';
import { isSupplyKind } from '../model/supplyKind';

const STORAGE_KEY = 'electric-app-supply-kind';

export function loadStoredSupplyKind(): SupplyKind | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v !== null && isSupplyKind(v)) {
      return v;
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function persistSupplyKind(kind: SupplyKind): void {
  try {
    localStorage.setItem(STORAGE_KEY, kind);
  } catch {
    /* ignore */
  }
}
