import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { initialScene, sceneReducer } from './model/scene';
import type { SupplyKind } from './model/supplyKind';
import type { ComponentKind } from './model/types';
import type { PartId } from './model/ids';
import type { PinId } from './model/ids';
import { simulate } from './sim';
import { HeaderSettings } from './ui/HeaderSettings';
import {
  loadStoredHoverBarPosition,
  loadStoredRotateHandlePosition,
  type PartHoverBarPosition,
  type RotateHandlePosition,
} from './ui/partHoverLayout';
import { Palette } from './ui/palette/Palette';
import {
  loadStoredSupplyKind,
  persistSupplyKind,
} from './ui/supplyKindStorage';
import { PartView } from './ui/parts/PartView';
import { WireLayer } from './ui/wires/WireLayer';
import {
  angleFromCenterDeg,
  identityTransform,
  normalizeDeg,
  screenToBoard,
} from './ui/coords';
import { useReducedMotion } from './hooks/useReducedMotion';

const BOARD_W = 800;
const BOARD_H = 600;

export function App() {
  const [scene, dispatch] = useReducer(sceneReducer, initialScene());
  const [testActive, setTestActive] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [hoverBarPosition, setHoverBarPosition] = useState<PartHoverBarPosition>(
    () => loadStoredHoverBarPosition() ?? 'up',
  );
  const [rotateHandlePosition, setRotateHandlePosition] =
    useState<RotateHandlePosition>(
      () => loadStoredRotateHandlePosition() ?? 'right',
    );
  const [supplyKind, setSupplyKind] = useState<SupplyKind>(
    () => loadStoredSupplyKind() ?? 'dc',
  );
  const reducedMotion = useReducedMotion();
  const svgRef = useRef<SVGSVGElement | null>(null);
  const sceneRef = useRef(scene);
  sceneRef.current = scene;
  const dragRef = useRef<{
    partId: PartId;
    grabDx: number;
    grabDy: number;
  } | null>(null);
  const rotateDragRef = useRef<{
    partId: PartId;
    startPointerAngleDeg: number;
    startRotationDeg: number;
  } | null>(null);

  const sim = useMemo(
    () => simulate(scene, { testActive, supplyKind }),
    [scene, testActive, supplyKind],
  );

  useEffect(() => {
    persistSupplyKind(supplyKind);
  }, [supplyKind]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        dispatch({ type: 'cancelWire' });
        setSettingsOpen(false);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const addPart = useCallback((kind: ComponentKind) => {
    const n = scene.parts.length;
    const x = 160 + (n % 4) * 140;
    const y = 160 + Math.floor(n / 4) * 100;
    dispatch({ type: 'addPart', kind, x, y });
  }, [scene.parts.length]);

  const onPinClick = useCallback((pin: PinId) => {
    if (scene.wireDraftFrom === null) {
      dispatch({ type: 'beginWire', pin });
    } else {
      dispatch({ type: 'completeWire', pin });
    }
  }, [scene.wireDraftFrom]);

  const onBodyPointerDown = useCallback(
    (partId: PartId, e: ReactPointerEvent<SVGRectElement>) => {
      const svg = svgRef.current;
      if (!svg) return;
      e.currentTarget.setPointerCapture(e.pointerId);
      const part = sceneRef.current.parts.find((p) => p.id === partId);
      if (!part) return;
      const { x, y } = screenToBoard(
        e.clientX,
        e.clientY,
        svg,
        identityTransform,
      );
      dragRef.current = {
        partId,
        grabDx: part.x - x,
        grabDy: part.y - y,
      };
    },
    [],
  );

  const onRotatePointerDown = useCallback(
    (partId: PartId, e: ReactPointerEvent<HTMLButtonElement>) => {
      const svg = svgRef.current;
      if (!svg) return;
      const part = sceneRef.current.parts.find((p) => p.id === partId);
      if (!part) return;
      const { x, y } = screenToBoard(
        e.clientX,
        e.clientY,
        svg,
        identityTransform,
      );
      const startPointerAngleDeg = angleFromCenterDeg(part.x, part.y, x, y);
      rotateDragRef.current = {
        partId,
        startPointerAngleDeg,
        startRotationDeg: part.rotationDeg,
      };
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    },
    [],
  );

  useEffect(() => {
    function onPointerMove(e: PointerEvent) {
      const svg = svgRef.current;
      const rot = rotateDragRef.current;
      if (rot && svg) {
        const part = sceneRef.current.parts.find((p) => p.id === rot.partId);
        if (!part) return;
        const { x, y } = screenToBoard(
          e.clientX,
          e.clientY,
          svg,
          identityTransform,
        );
        const ang = angleFromCenterDeg(part.x, part.y, x, y);
        const rotationDeg = normalizeDeg(
          rot.startRotationDeg + (ang - rot.startPointerAngleDeg),
        );
        dispatch({
          type: 'setPartRotation',
          partId: rot.partId,
          rotationDeg,
        });
        return;
      }
      const d = dragRef.current;
      if (!d || !svg) return;
      const { x, y } = screenToBoard(
        e.clientX,
        e.clientY,
        svg,
        identityTransform,
      );
      dispatch({
        type: 'movePart',
        partId: d.partId,
        x: x + d.grabDx,
        y: y + d.grabDy,
      });
    }
    function onPointerUp() {
      rotateDragRef.current = null;
      dragRef.current = null;
    }
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
    };
  }, []);

  return (
    <div className="app-root">
      <header className="app-header">
        <h1 className="app-title">Electric workshop</h1>
        <div className="app-controls">
          <button
            type="button"
            className={testActive ? 'btn btn--on' : 'btn'}
            aria-pressed={testActive}
            onClick={() => setTestActive((v) => !v)}
          >
            {testActive ? 'Test on' : 'Test off'}
          </button>
          <HeaderSettings
            open={settingsOpen}
            onOpenChange={setSettingsOpen}
            hoverBarPosition={hoverBarPosition}
            onHoverBarPositionChange={setHoverBarPosition}
            rotateHandlePosition={rotateHandlePosition}
            onRotateHandlePositionChange={setRotateHandlePosition}
          />
        </div>
      </header>
      <div className="app-main">
        <Palette
          supplyKind={supplyKind}
          onSupplyKindChange={setSupplyKind}
          onAdd={addPart}
        />
        <section
          className="board-section"
          aria-label="Workbench board"
        >
          <svg
            ref={svgRef}
            className="board-svg"
            viewBox={`0 0 ${BOARD_W} ${BOARD_H}`}
            role="img"
            aria-label="Circuit board; drag parts and connect pins."
          >
            <rect
              className="board-bg"
              width={BOARD_W}
              height={BOARD_H}
              rx={12}
            />
            <WireLayer
              scene={scene}
              energizedWireIds={sim.energizedWireIds}
              testActive={sim.testActive}
              reducedMotion={reducedMotion}
              supplyKind={supplyKind}
            />
            {scene.parts.map((p) => (
              <PartView
                key={p.id}
                part={p}
                hint={sim.partHints.get(p.id)}
                testActive={sim.testActive}
                draftPin={scene.wireDraftFrom}
                hoverBarPosition={hoverBarPosition}
                rotateHandlePosition={rotateHandlePosition}
                onPinClick={onPinClick}
                onBodyPointerDown={(e) => onBodyPointerDown(p.id, e)}
                onRemove={() =>
                  dispatch({ type: 'deletePart', partId: p.id })
                }
                onToggleSwitch={
                  p.kind === 'switch'
                    ? () => dispatch({ type: 'toggleSwitch', partId: p.id })
                    : undefined
                }
                onToggleBreaker={
                  p.kind === 'breaker_2p'
                    ? () => dispatch({ type: 'toggleBreaker', partId: p.id })
                    : undefined
                }
                onRotatePointerDown={(e) => onRotatePointerDown(p.id, e)}
              />
            ))}
          </svg>
          <p className="sr-only" role="status" aria-live="polite">
            {sim.statusMessage}
          </p>
        </section>
      </div>
    </div>
  );
}
