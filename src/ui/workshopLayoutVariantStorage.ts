export type WorkshopLayoutVariant = 'v1' | 'v2';

const STORAGE_KEY = 'electric-app-workshop-layout-variant';

function isLayoutVariant(v: string): v is WorkshopLayoutVariant {
  return v === 'v1' || v === 'v2';
}

export function loadStoredWorkshopLayoutVariant(): WorkshopLayoutVariant | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v !== null && isLayoutVariant(v)) {
      return v;
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function persistWorkshopLayoutVariant(
  variant: WorkshopLayoutVariant,
): void {
  try {
    localStorage.setItem(STORAGE_KEY, variant);
  } catch {
    /* ignore */
  }
}
