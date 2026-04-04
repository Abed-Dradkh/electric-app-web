import { pinWorldPosition } from './pinLayout';
import type { Scene, Wire, WirePoint } from './types';

/** Board grid step (px); must match SVG grid overlay when present. */
export const GRID_STEP = 20;

export function snapToGrid(
  x: number,
  y: number,
  step: number = GRID_STEP,
): { x: number; y: number } {
  return {
    x: Math.round(x / step) * step,
    y: Math.round(y / step) * step,
  };
}

/** Full polyline: pin A, internal waypoints, pin B. */
export function buildWirePolyline(
  scene: Scene,
  wire: Wire,
): { x: number; y: number }[] | null {
  const a = pinWorldPosition(scene, wire.pinA);
  const b = pinWorldPosition(scene, wire.pinB);
  if (!a || !b) return null;
  const w = wire.waypoints ?? [];
  return [{ x: a.x, y: a.y }, ...w.map((p) => ({ x: p.x, y: p.y })), { x: b.x, y: b.y }];
}

export function polylineToSvgPath(
  points: readonly { x: number; y: number }[],
): string {
  if (points.length === 0) return '';
  const [p0, ...rest] = points;
  let d = `M ${p0.x} ${p0.y}`;
  for (const p of rest) {
    d += ` L ${p.x} ${p.y}`;
  }
  return d;
}

/** Legacy automatic path when a wire has no waypoints (quadratic offset from chord). */
export function wireAutoCurvePath(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): { d: string; midX: number; midY: number } {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const ox = (-dy / len) * 12;
  const oy = (dx / len) * 12;
  const cx = mx + ox;
  const cy = my + oy;
  const d = `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;
  const midX = 0.25 * x1 + 0.5 * cx + 0.25 * x2;
  const midY = 0.25 * y1 + 0.5 * cy + 0.25 * y2;
  return { d, midX, midY };
}

/** Half arc-length position along the polyline (for delete hint, etc.). */
export function midpointAlongPolyline(
  points: readonly { x: number; y: number }[],
): { midX: number; midY: number } {
  if (points.length === 0) return { midX: 0, midY: 0 };
  if (points.length === 1) {
    const p = points[0]!;
    return { midX: p.x, midY: p.y };
  }
  let total = 0;
  const segLens: number[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const dx = points[i + 1]!.x - points[i]!.x;
    const dy = points[i + 1]!.y - points[i]!.y;
    const L = Math.hypot(dx, dy);
    segLens.push(L);
    total += L;
  }
  if (total < 1e-9) {
    const p = points[0]!;
    return { midX: p.x, midY: p.y };
  }
  let target = total / 2;
  for (let i = 0; i < points.length - 1; i++) {
    const L = segLens[i]!;
    if (target <= L || i === points.length - 2) {
      const t = L > 1e-9 ? Math.min(1, target / L) : 0;
      const ax = points[i]!.x;
      const ay = points[i]!.y;
      const bx = points[i + 1]!.x;
      const by = points[i + 1]!.y;
      return {
        midX: ax + t * (bx - ax),
        midY: ay + t * (by - ay),
      };
    }
    target -= L;
  }
  const last = points[points.length - 1]!;
  return { midX: last.x, midY: last.y };
}

export type WirePathPreview = {
  readonly internalIndex: number;
  readonly x: number;
  readonly y: number;
};

/**
 * Path string and hint midpoint for rendering. With waypoints, uses a polyline;
 * without waypoints, uses the legacy quadratic curve (hit test still uses chord polyline for clicks).
 */
export function getWireRenderGeometry(
  scene: Scene,
  wire: Wire,
  preview: WirePathPreview | null | undefined,
): {
  d: string;
  midX: number;
  midY: number;
  polyline: { x: number; y: number }[];
  /** True when drawing uses explicit polyline (not auto curve). */
  readonly isRouted: boolean;
} | null {
  const a = pinWorldPosition(scene, wire.pinA);
  const b = pinWorldPosition(scene, wire.pinB);
  if (!a || !b) return null;

  let waypoints = [...(wire.waypoints ?? [])];
  if (preview !== undefined && preview !== null) {
    const i = preview.internalIndex;
    if (i >= 0 && i < waypoints.length) {
      waypoints = waypoints.map((w, j) =>
        j === i ? { x: preview.x, y: preview.y } : w,
      );
    }
  }

  if (waypoints.length === 0) {
    const curve = wireAutoCurvePath(a.x, a.y, b.x, b.y);
    const polyline = [
      { x: a.x, y: a.y },
      { x: b.x, y: b.y },
    ];
    return {
      d: curve.d,
      midX: curve.midX,
      midY: curve.midY,
      polyline,
      isRouted: false,
    };
  }

  const polyline = [
    { x: a.x, y: a.y },
    ...waypoints.map((p) => ({ x: p.x, y: p.y })),
    { x: b.x, y: b.y },
  ];
  const d = polylineToSvgPath(polyline);
  const { midX, midY } = midpointAlongPolyline(polyline);
  return { d, midX, midY, polyline, isRouted: true };
}

function closestPointOnSegment(
  ax: number,
  ay: number,
  bx: number,
  by: number,
  px: number,
  py: number,
): { x: number; y: number; distSq: number } {
  const abx = bx - ax;
  const aby = by - ay;
  const apx = px - ax;
  const apy = py - ay;
  const ab2 = abx * abx + aby * aby;
  let t = ab2 > 1e-12 ? (apx * abx + apy * aby) / ab2 : 0;
  t = Math.max(0, Math.min(1, t));
  const x = ax + t * abx;
  const y = ay + t * aby;
  const dx = px - x;
  const dy = py - y;
  return { x, y, distSq: dx * dx + dy * dy };
}

export function findClosestSegmentOnPolyline(
  points: readonly { x: number; y: number }[],
  px: number,
  py: number,
): { segmentIndex: number; closest: { x: number; y: number }; distanceSq: number } | null {
  if (points.length < 2) return null;
  let bestSeg = 0;
  let bestClosest = { x: points[0]!.x, y: points[0]!.y };
  let bestDist = Infinity;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i]!;
    const p1 = points[i + 1]!;
    const c = closestPointOnSegment(p0.x, p0.y, p1.x, p1.y, px, py);
    if (c.distSq < bestDist) {
      bestDist = c.distSq;
      bestSeg = i;
      bestClosest = { x: c.x, y: c.y };
    }
  }
  return { segmentIndex: bestSeg, closest: bestClosest, distanceSq: bestDist };
}

/**
 * Insert a snapped waypoint along segment `segmentIndex` (0 = first segment from pin A).
 * `waypoints` is the wire's current internal waypoint list only.
 */
export function insertWaypointAtSegment(
  waypoints: readonly WirePoint[],
  segmentIndex: number,
  point: WirePoint,
): WirePoint[] {
  const j = Math.max(0, Math.min(segmentIndex, waypoints.length));
  return [...waypoints.slice(0, j), point, ...waypoints.slice(j)];
}
