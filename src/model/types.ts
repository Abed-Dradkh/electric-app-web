import type { PartId, PinId, WireId } from './ids';

/** Kinds of components available in the workshop. */
export type ComponentKind = 'battery' | 'bulb' | 'resistor' | 'led' | 'switch';

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
};

/** User-drawn connection between two pins. */
export type Wire = {
  readonly id: WireId;
  readonly pinA: PinId;
  readonly pinB: PinId;
};

/** Full editor scene. */
export type Scene = {
  readonly parts: readonly Part[];
  readonly wires: readonly Wire[];
  /** Pin selected as first endpoint while wiring (if any). */
  readonly wireDraftFrom: PinId | null;
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
  | { type: 'beginWire'; pin: PinId }
  | { type: 'completeWire'; pin: PinId }
  | { type: 'cancelWire' }
  | { type: 'deleteWire'; wireId: WireId }
  | { type: 'deletePart'; partId: PartId };
