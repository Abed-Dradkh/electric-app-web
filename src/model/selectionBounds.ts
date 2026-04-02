import type { PartId } from './ids';
import { rotateLocalOffset } from './pinLayout';
import type { Part } from './types';

/** Matches `PartView` body rect half-extents (centered on part). */
const HALF_W = 56;
const HALF_H = 36;

export type AxisAlignedBounds = {
  readonly minX: number;
  readonly maxX: number;
  readonly minY: number;
  readonly maxY: number;
};

export function partAxisAlignedBounds(part: Part): AxisAlignedBounds {
  const corners: readonly [number, number][] = [
    [-HALF_W, -HALF_H],
    [HALF_W, -HALF_H],
    [HALF_W, HALF_H],
    [-HALF_W, HALF_H],
  ];
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const [lx, ly] of corners) {
    const r = rotateLocalOffset(lx, ly, part.rotationDeg);
    const wx = part.x + r.x;
    const wy = part.y + r.y;
    minX = Math.min(minX, wx);
    maxX = Math.max(maxX, wx);
    minY = Math.min(minY, wy);
    maxY = Math.max(maxY, wy);
  }
  return { minX, maxX, minY, maxY };
}

export function normalizeMarqueeRect(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
): AxisAlignedBounds {
  return {
    minX: Math.min(x0, x1),
    maxX: Math.max(x0, x1),
    minY: Math.min(y0, y1),
    maxY: Math.max(y0, y1),
  };
}

export function aabbsIntersect(a: AxisAlignedBounds, b: AxisAlignedBounds): boolean {
  return (
    a.minX <= b.maxX &&
    a.maxX >= b.minX &&
    a.minY <= b.maxY &&
    a.maxY >= b.minY
  );
}

export function partIdsInMarquee(
  parts: readonly Part[],
  marquee: AxisAlignedBounds,
): PartId[] {
  const out: PartId[] = [];
  for (const p of parts) {
    if (aabbsIntersect(partAxisAlignedBounds(p), marquee)) {
      out.push(p.id);
    }
  }
  return out;
}

export function unionBoundsForParts(
  parts: readonly Part[],
): AxisAlignedBounds | null {
  if (parts.length === 0) {
    return null;
  }
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const p of parts) {
    const b = partAxisAlignedBounds(p);
    minX = Math.min(minX, b.minX);
    maxX = Math.max(maxX, b.maxX);
    minY = Math.min(minY, b.minY);
    maxY = Math.max(maxY, b.maxY);
  }
  return { minX, maxX, minY, maxY };
}
