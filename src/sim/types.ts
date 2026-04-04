import type { PartId, WireId } from '../model/ids';
import type { SupplyKind } from '../model/supplyKind';

/** Per-component display hints for the view (Phase A). */
export type PartSimHint = {
  /** True while Test is on and this supply is on the board (visual “always live”). */
  readonly batterySupplying: boolean;
  readonly loadEnergized: boolean;
  /** Hot-side BFS reached any of this part’s pins (standby / half glow). */
  readonly supplyReachable: boolean;
};

export type SimResult = {
  /** User toggled “Test” / power. */
  readonly testActive: boolean;
  /** Battery + reaches battery − through conducting graph. */
  readonly isCompleteLoop: boolean;
  /** Wires that lie on at least one shortest +→− path (Phase A visualization). */
  readonly energizedWireIds: ReadonlySet<WireId>;
  /** Wires reachable from the supply hot terminal through conducting paths (standby glow). */
  readonly supplyReachWireIds: ReadonlySet<WireId>;
  /** Hints keyed by part id. */
  readonly partHints: ReadonlyMap<PartId, PartSimHint>;
  /** Human-readable status for assistive tech. */
  readonly statusMessage: string;
};

export type SimulateOptions = {
  readonly testActive: boolean;
  /** Defaults to DC when omitted. AC uses the same Phase A model until AC sim exists. */
  readonly supplyKind?: SupplyKind;
};
