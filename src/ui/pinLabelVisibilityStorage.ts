const STORAGE_KEY = 'electric-app-pin-labels-visible';

/** Whether short pin connector labels (L/N, +/−, …) are shown; defaults to true. */
export function loadStoredPinLabelsVisible(): boolean {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === '0' || v === 'false') {
      return false;
    }
    if (v === '1' || v === 'true') {
      return true;
    }
  } catch {
    /* ignore */
  }
  return true;
}

export function persistPinLabelsVisible(visible: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, visible ? '1' : '0');
  } catch {
    /* ignore */
  }
}
