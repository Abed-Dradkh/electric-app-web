import type { ComponentKind } from '../../model/types';

export type PaletteItem = {
  readonly kind: ComponentKind;
  readonly label: string;
};

/** Electronics bench (DC). */
export const PALETTE_ITEMS_DC: readonly PaletteItem[] = [
  { kind: 'battery', label: 'Battery' },
  { kind: 'bulb', label: 'Bulb' },
  { kind: 'resistor', label: 'Resistor' },
  { kind: 'led', label: 'LED' },
  { kind: 'switch', label: 'Switch' },
];

/** House wiring (AC) — L/N supply, protection, control, load. */
export const PALETTE_ITEMS_AC: readonly PaletteItem[] = [
  { kind: 'ac_supply', label: 'AC supply (L/N)' },
  { kind: 'breaker_2p', label: 'Breaker (2P)' },
  { kind: 'switch', label: 'Switch' },
  { kind: 'bulb', label: 'Lamp' },
];
