import type { PinId } from './ids';
import { pinId } from './ids';
import type { Part } from './types';

/** Pin roles for graph ids and layout (stable string suffixes after `partId:`). */
export type PinRole =
  | 'positive'
  | 'negative'
  | 'a'
  | 'b'
  | 'l'
  | 'n'
  | 'l_in'
  | 'n_in'
  | 'l_out'
  | 'n_out';

const PIN_ROLE_SET: ReadonlySet<string> = new Set([
  'positive',
  'negative',
  'a',
  'b',
  'l',
  'n',
  'l_in',
  'n_in',
  'l_out',
  'n_out',
]);

export function isPinRole(s: string): s is PinRole {
  return PIN_ROLE_SET.has(s);
}

/** Logical pin roles per component kind (stable ordering for graph). */
export const PIN_ROLES: Record<Part['kind'], readonly PinRole[]> = {
  battery: ['positive', 'negative'],
  bulb: ['a', 'b'],
  resistor: ['a', 'b'],
  led: ['a', 'b'],
  switch: ['a', 'b'],
  ac_supply: ['l', 'n'],
  breaker_2p: ['l_in', 'n_in', 'l_out', 'n_out'],
};

export function makePinId(partId: string, role: PinRole): PinId {
  return pinId(`${partId}:${role}`);
}

/** Offset from part center to pin anchor (board px). */
export function pinOffset(part: Part, role: PinRole): { x: number; y: number } {
  const s = 40;
  switch (part.kind) {
    case 'battery':
      return role === 'positive' ? { x: -s, y: 0 } : { x: s, y: 0 };
    case 'ac_supply':
      return role === 'l' ? { x: -s, y: 0 } : { x: s, y: 0 };
    case 'bulb':
      return role === 'a' ? { x: 0, y: -s } : { x: 0, y: s };
    case 'resistor':
      return role === 'a' ? { x: -s, y: 0 } : { x: s, y: 0 };
    case 'led':
      return role === 'a' ? { x: -s, y: 0 } : { x: s, y: 0 };
    case 'switch':
      return role === 'a' ? { x: -s, y: 0 } : { x: s, y: 0 };
    case 'breaker_2p': {
      const u = 48;
      const v = 26;
      switch (role) {
        case 'l_in':
          return { x: -u, y: -v };
        case 'n_in':
          return { x: u, y: -v };
        case 'l_out':
          return { x: -u, y: v };
        case 'n_out':
          return { x: u, y: v };
        default:
          return { x: 0, y: 0 };
      }
    }
  }
}

/** Rotates a local offset around the origin (part center). */
export function rotateLocalOffset(
  lx: number,
  ly: number,
  rotationDeg: number,
): { x: number; y: number } {
  const rad = (rotationDeg * Math.PI) / 180;
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  return { x: lx * c - ly * s, y: lx * s + ly * c };
}

export function pinPosition(
  part: Part,
  role: PinRole,
): { x: number; y: number } {
  const o = pinOffset(part, role);
  const r = rotateLocalOffset(o.x, o.y, part.rotationDeg);
  return { x: part.x + r.x, y: part.y + r.y };
}

export function allPinsForPart(part: Part): PinId[] {
  return PIN_ROLES[part.kind].map((role) => makePinId(part.id, role));
}

/** Resolves a pin id to board coordinates, or `null` if unknown. */
export function pinWorldPosition(
  scene: { readonly parts: readonly Part[] },
  pin: PinId,
): { x: number; y: number } | null {
  const s = String(pin);
  const idx = s.lastIndexOf(':');
  if (idx <= 0) return null;
  const partIdStr = s.slice(0, idx);
  const roleStr = s.slice(idx + 1);
  const part = scene.parts.find((p) => p.id === partIdStr);
  if (!part || !isPinRole(roleStr)) return null;
  return pinPosition(part, roleStr);
}
