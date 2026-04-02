import type { Scene } from '../../model/types';
import type { WireId } from '../../model/ids';
import { pinWorldPosition } from '../../model/pinLayout';

export type WireLayerProps = {
  readonly scene: Scene;
  readonly energizedWireIds: ReadonlySet<WireId>;
  readonly testActive: boolean;
  readonly reducedMotion: boolean;
};

function wirePath(x1: number, y1: number, x2: number, y2: number): string {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const ox = (-dy / len) * 12;
  const oy = (dx / len) * 12;
  return `M ${x1} ${y1} Q ${mx + ox} ${my + oy} ${x2} ${y2}`;
}

export function WireLayer({
  scene,
  energizedWireIds,
  testActive,
  reducedMotion,
}: WireLayerProps) {
  return (
    <g className="wire-layer" aria-hidden>
      {scene.wires.map((w) => {
        const a = pinWorldPosition(scene, w.pinA);
        const b = pinWorldPosition(scene, w.pinB);
        if (!a || !b) return null;
        const d = wirePath(a.x, a.y, b.x, b.y);
        const live = testActive && energizedWireIds.has(w.id);
        const animClass =
          live && !reducedMotion ? ' wire-stroke--live-anim' : '';
        return (
          <g key={w.id}>
            {live ? (
              <path
                className={`wire-stroke wire-stroke--glow${animClass}`}
                d={d}
                fill="none"
              />
            ) : null}
            <path
              className={
                live
                  ? `wire-stroke wire-stroke--live${animClass}`
                  : 'wire-stroke wire-stroke--idle'
              }
              d={d}
              fill="none"
            />
          </g>
        );
      })}
    </g>
  );
}
