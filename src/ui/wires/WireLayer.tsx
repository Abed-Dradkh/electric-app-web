import type { KeyboardEvent, MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';
import type { WireId } from '../../model/ids';
import { wireAdjacentToSupply } from '../../model/pinLayout';
import { getWireRenderGeometry } from '../../model/wirePath';
import type { SupplyKind } from '../../model/supplyKind';
import type { Scene } from '../../model/types';
import type { WireWaypointPreview } from './WireHandles';

export type WireLayerProps = {
  readonly scene: Scene;
  readonly energizedWireIds: ReadonlySet<WireId>;
  readonly testActive: boolean;
  readonly reducedMotion: boolean;
  readonly supplyKind: SupplyKind;
  readonly selectedWireId: WireId | null;
  readonly waypointPreview: WireWaypointPreview | null;
  readonly onSelectWire: (wireId: WireId) => void;
  readonly onRemoveWire: (wireId: WireId) => void;
  readonly onWireSegmentDoubleClick: (
    wireId: WireId,
    clientX: number,
    clientY: number,
  ) => void;
};

function stopWireEvent(e: { stopPropagation: () => void }) {
  e.stopPropagation();
}

export function WireLayer({
  scene,
  energizedWireIds,
  testActive,
  reducedMotion,
  supplyKind,
  selectedWireId,
  waypointPreview,
  onSelectWire,
  onRemoveWire,
  onWireSegmentDoubleClick,
}: WireLayerProps) {
  const { t } = useTranslation();
  const layerClass =
    supplyKind === 'ac' ? 'wire-layer wire-layer--ac' : 'wire-layer';

  return (
    <g className={layerClass}>
      {scene.wires.map((w) => {
        const preview =
          waypointPreview?.wireId === w.id ? waypointPreview : null;
        const geom = getWireRenderGeometry(scene, w, preview);
        if (!geom) return null;
        const { d, isRouted } = geom;
        const live =
          testActive &&
          (wireAdjacentToSupply(scene, w) || energizedWireIds.has(w.id));
        const animClass =
          live && !reducedMotion ? ' wire-stroke--live-anim' : '';
        const kindClass = `wire-stroke--kind-${w.kind}`;
        const selected = selectedWireId === w.id;

        const aria =
          selected && isRouted
            ? t('wire.selectedRouted')
            : t('wire.selectWire');

        return (
          <g key={w.id} className="wire-bundle">
            <path
              className="wire-hit"
              d={d}
              fill="none"
              role="button"
              tabIndex={0}
              aria-label={aria}
              aria-pressed={selected}
              onPointerDown={stopWireEvent}
              onClick={(e: MouseEvent<SVGPathElement>) => {
                stopWireEvent(e);
                if (e.altKey) {
                  onRemoveWire(w.id);
                } else {
                  onSelectWire(w.id);
                }
              }}
              onDoubleClick={(e) => {
                stopWireEvent(e);
                if (selectedWireId !== w.id) return;
                onWireSegmentDoubleClick(w.id, e.clientX, e.clientY);
              }}
              onKeyDown={(e: KeyboardEvent<SVGPathElement>) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  stopWireEvent(e);
                  onSelectWire(w.id);
                }
              }}
            />
            {live ? (
              <path
                className={`wire-stroke wire-stroke--glow ${kindClass}${animClass}`}
                d={d}
                fill="none"
                pointerEvents="none"
              />
            ) : null}
            <path
              className={
                live
                  ? `wire-stroke wire-stroke--live ${kindClass}${animClass}`
                  : `wire-stroke wire-stroke--idle ${kindClass}`
              }
              d={d}
              fill="none"
              pointerEvents="none"
            />
          </g>
        );
      })}
    </g>
  );
}
