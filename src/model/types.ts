import type { PartId, PinId, WireId } from './ids';

/**
 * Household-style conductor roles (visual; future sim may use these).
 * Maps to black (live), blue (neutral), red (switched live) in the UI.
 */
export type WireKind = 'live' | 'neutral' | 'switched';

/** Kinds of components available in the workshop. */
export type ComponentKind =
  | 'battery'
  | 'bulb'
  | 'resistor'
  | 'led'
  | 'switch'
  | 'ac_supply'
  | 'breaker_2p';

/** A component instance on the board. */
export type Part = {
  readonly id: PartId;
  readonly kind: ComponentKind;
  /** Board-space position (pixels). */
  readonly x: number;
  readonly y: number;
  /** Degrees; rotation around part center, +Y is “up” in local space at 0°. */
  readonly rotationDeg: number;
  /** Only meaningful when `kind === 'switch'`. */
  readonly switchClosed: boolean;
  /** Only meaningful when `kind === 'breaker_2p'` — both poles conduct when true. */
  readonly breakerOn: boolean;
};

/** Board-space point for wire routing (internal bends between pins). */
export type WirePoint = {
  readonly x: number;
  readonly y: number;
};

/** User-drawn connection between two pins. */
export type Wire = {
  readonly id: WireId;
  readonly pinA: PinId;
  readonly pinB: PinId;
  readonly kind: WireKind;
  /**
   * Optional internal waypoints (board px). Endpoints are always pin positions.
   * Omitted or empty: UI uses automatic curved path between pins.
   */
  readonly waypoints?: readonly WirePoint[];
};

/** Full editor scene. */
export type Scene = {
  readonly parts: readonly Part[];
  readonly wires: readonly Wire[];
  /** Pin selected as first endpoint while wiring (if any). */
  readonly wireDraftFrom: PinId | null;
  /** Kind for the wire in progress (set when the first pin is chosen). */
  readonly wireDraftKind: WireKind;
  /** Monotonic counter for generating ids. */
  readonly nextPartIndex: number;
  readonly nextWireIndex: number;
};

/** Actions for the scene reducer. */
export type SceneAction =
  | { type: 'addPart'; kind: ComponentKind; x: number; y: number }
  | { type: 'movePart'; partId: PartId; x: number; y: number }
  | { type: 'setPartRotation'; partId: PartId; rotationDeg: number }
  | { type: 'toggleSwitch'; partId: PartId }
  | { type: 'toggleBreaker'; partId: PartId }
  | { type: 'beginWire'; pin: PinId; kind: WireKind }
  | { type: 'completeWire'; pin: PinId }
  | { type: 'cancelWire' }
  | { type: 'deleteWire'; wireId: WireId }
  | {
      type: 'setWireWaypoints';
      wireId: WireId;
      waypoints: readonly WirePoint[];
    }
  | { type: 'deletePart'; partId: PartId }
  | { type: 'deleteParts'; partIds: readonly PartId[] };
