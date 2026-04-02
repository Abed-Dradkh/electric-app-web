import type { ComponentKind } from '../../model/types';

/** Electronics bench (DC). */
export const PALETTE_KINDS_DC: readonly ComponentKind[] = [
  'battery',
  'bulb',
  'resistor',
  'led',
  'switch',
];

/** House wiring (AC) — L/N supply, protection, control, load. */
export const PALETTE_KINDS_AC: readonly ComponentKind[] = [
  'ac_supply',
  'breaker_2p',
  'switch',
  'bulb',
];
