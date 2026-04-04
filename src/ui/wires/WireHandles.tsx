import type { PointerEvent as ReactPointerEvent } from 'react';
import type { WireId } from '../../model/ids';
import type { Scene } from '../../model/types';

export type WireWaypointPreview = {
  readonly wireId: WireId;
  readonly internalIndex: number;
  readonly x: number;
  readonly y: number;
};

export type WireHandlesProps = {
  readonly scene: Scene;
  readonly selectedWireId: WireId | null;
  readonly preview: WireWaypointPreview | null;
  readonly onWaypointPointerDown: (
    wireId: WireId,
    internalIndex: number,
    e: ReactPointerEvent<SVGCircleElement>,
  ) => void;
};

function stop(e: { stopPropagation: () => void }) {
  e.stopPropagation();
}

/**
 * Draggable handles for internal wire waypoints (rendered above parts when a wire is selected).
 */
export function WireHandles({
  scene,
  selectedWireId,
  preview,
  onWaypointPointerDown,
}: WireHandlesProps) {
  if (!selectedWireId) return null;
  const wire = scene.wires.find((w) => w.id === selectedWireId);
  if (!wire) return null;
  const wps = wire.waypoints ?? [];
  if (wps.length === 0) return null;

  return (
    <g className="wire-handles" aria-hidden>
      {wps.map((wp, i) => {
        const pos =
          preview?.wireId === wire.id && preview.internalIndex === i
            ? { x: preview.x, y: preview.y }
            : { x: wp.x, y: wp.y };
        return (
          <circle
            key={`${wire.id}-${i}`}
            className="wire-waypoint-handle"
            cx={pos.x}
            cy={pos.y}
            r={9}
            tabIndex={-1}
            onPointerDown={(e) => {
              stop(e);
              onWaypointPointerDown(wire.id, i, e);
            }}
          />
        );
      })}
    </g>
  );
}
