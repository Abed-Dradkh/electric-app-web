/** Board space uses the same units as SVG viewBox pixels. */
export type BoardTransform = {
  readonly scale: number;
  readonly tx: number;
  readonly ty: number;
};

export const identityTransform: BoardTransform = {
  scale: 1,
  tx: 0,
  ty: 0,
};

export function screenToBoard(
  clientX: number,
  clientY: number,
  svg: SVGSVGElement,
  t: BoardTransform,
): { x: number; y: number } {
  const pt = svg.createSVGPoint();
  pt.x = clientX;
  pt.y = clientY;
  const ctm = svg.getScreenCTM();
  if (!ctm) {
    return { x: clientX, y: clientY };
  }
  const p = pt.matrixTransform(ctm.inverse());
  return { x: (p.x - t.tx) / t.scale, y: (p.y - t.ty) / t.scale };
}

/** Board angle in degrees: +X = 0°, +Y = 90°. */
export function angleFromCenterDeg(
  centerX: number,
  centerY: number,
  px: number,
  py: number,
): number {
  return (Math.atan2(py - centerY, px - centerX) * 180) / Math.PI;
}

/** Maps any degree to (−180, 180]. */
export function normalizeDeg(deg: number): number {
  let d = deg % 360;
  if (d > 180) d -= 360;
  if (d <= -180) d += 360;
  return d;
}
