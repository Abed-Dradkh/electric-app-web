import type { PartId, WireId } from '../model/ids';

/** Per-component display hints for the view (Phase A). */
export type PartSimHint = {
  readonly batterySupplying: boolean;
  readonly loadEnergized: boolean;
};

export type SimResult = {
  /** User toggled “Test” / power. */
  readonly testActive: boolean;
  /** Battery + reaches battery − through conducting graph. */
  readonly isCompleteLoop: boolean;
  /** Wires that lie on at least one shortest +→− path (Phase A visualization). */
  readonly energizedWireIds: ReadonlySet<WireId>;
  /** Hints keyed by part id. */
  readonly partHints: ReadonlyMap<PartId, PartSimHint>;
  /** Human-readable status for assistive tech. */
  readonly statusMessage: string;
};

export type SimulateOptions = {
  readonly testActive: boolean;
};
