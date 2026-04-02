import type { KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import type { SupplyKind } from '../../model/supplyKind';
import type { Scene } from '../../model/types';
import type { WireId } from '../../model/ids';
import { pinWorldPosition } from '../../model/pinLayout';

export type WireLayerProps = {
  readonly scene: Scene;
  readonly energizedWireIds: ReadonlySet<WireId>;
  readonly testActive: boolean;
  readonly reducedMotion: boolean;
  readonly supplyKind: SupplyKind;
  readonly onRemoveWire: (wireId: WireId) => void;
};

function wireCurve(
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

function stopWireEvent(e: { stopPropagation: () => void }) {
  e.stopPropagation();
}

export function WireLayer({
  scene,
  energizedWireIds,
  testActive,
  reducedMotion,
  supplyKind,
  onRemoveWire,
}: WireLayerProps) {
  const { t } = useTranslation();
  const layerClass =
    supplyKind === 'ac' ? 'wire-layer wire-layer--ac' : 'wire-layer';

  return (
    <g className={layerClass}>
      {scene.wires.map((w) => {
        const a = pinWorldPosition(scene, w.pinA);
        const b = pinWorldPosition(scene, w.pinB);
        if (!a || !b) return null;
        const { d, midX, midY } = wireCurve(a.x, a.y, b.x, b.y);
        const live = testActive && energizedWireIds.has(w.id);
        const animClass =
          live && !reducedMotion ? ' wire-stroke--live-anim' : '';
        return (
          <g key={w.id} className="wire-bundle">
            <path
              className="wire-hit"
              d={d}
              fill="none"
              role="button"
              tabIndex={0}
              aria-label={t('wire.removeWire')}
              onPointerDown={stopWireEvent}
              onClick={(e) => {
                stopWireEvent(e);
                onRemoveWire(w.id);
              }}
              onKeyDown={(e: KeyboardEvent<SVGPathElement>) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  stopWireEvent(e);
                  onRemoveWire(w.id);
                }
              }}
            />
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
            <g
              className="wire-hover-hint"
              transform={`translate(${midX},${midY})`}
              aria-hidden
            >
              <circle className="wire-hover-hint-bg" r={15} />
              <path
                className="wire-hover-hint-x"
                d="M -6 -6 L 6 6 M -6 6 L 6 -6"
                fill="none"
              />
            </g>
          </g>
        );
      })}
    </g>
  );
}
