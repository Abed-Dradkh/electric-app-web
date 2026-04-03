import type { TFunction } from 'i18next';
import type { PinRole } from '../../model/pinLayout';
import type { Part } from '../../model/types';

/**
 * Short text shown above each pin (e.g. L/N, +/−), distinct from full ARIA names.
 */
export function pinConnectorShortLabel(
  t: TFunction,
  kind: Part['kind'],
  role: PinRole,
): string {
  switch (kind) {
    case 'battery':
      return role === 'positive'
        ? t('pin.short.positive')
        : t('pin.short.negative');
    case 'ac_supply':
      return role === 'l' ? t('pin.short.line') : t('pin.short.neutral');
    case 'bulb':
    case 'resistor':
    case 'switch':
      return role === 'a' ? t('pin.short.a') : t('pin.short.b');
    case 'led':
      return role === 'a'
        ? t('pin.short.ledAnode')
        : t('pin.short.ledCathode');
    case 'breaker_2p':
      switch (role) {
        case 'l_in':
          return t('pin.short.lineIn');
        case 'n_in':
          return t('pin.short.neutralIn');
        case 'l_out':
          return t('pin.short.lineOut');
        case 'n_out':
          return t('pin.short.neutralOut');
        default:
          return '?';
      }
  }
}

export type PinLabelPlacement = {
  readonly lx: number;
  readonly ly: number;
  readonly textAnchor: 'start' | 'middle' | 'end';
  readonly dominantBaseline: 'middle' | 'auto';
};

/** Vertical gap from pin center to label (label sits above the pin, smaller SVG y). */
const ABOVE_PAD = 13;

/**
 * Places a short pin label centered above the pin (toward −y in part space).
 */
export function pinConnectorLabelPlacement(
  ox: number,
  oy: number,
): PinLabelPlacement {
  return {
    lx: ox,
    ly: oy - ABOVE_PAD,
    textAnchor: 'middle',
    dominantBaseline: 'middle',
  };
}
