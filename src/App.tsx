import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { initialScene, sceneReducer } from './model/scene';
import {
  normalizeMarqueeRect,
  partIdsInMarquee,
} from './model/selectionBounds';
import type { SupplyKind } from './model/supplyKind';
import type { ComponentKind } from './model/types';
import type { PartId, PinId, WireId } from './model/ids';
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
  isAppLocale,
  persistLocale,
} from './ui/localeStorage';
import {
  loadStoredSupplyKind,
  persistSupplyKind,
} from './ui/supplyKindStorage';
import { PartView } from './ui/parts/PartView';
import { SelectionToolbar } from './ui/SelectionToolbar';
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

/** Drag length below this (board px) counts as a click, not a marquee. */
const MARQUEE_CLICK_PX = 6;

export function App() {
  const { t, i18n } = useTranslation();
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
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<PartId>>(
    () => new Set(),
  );
  const [marquee, setMarquee] = useState<{
    x0: number;
    y0: number;
    x1: number;
    y1: number;
  } | null>(null);
  const marqueeStartRef = useRef<{ x0: number; y0: number } | null>(null);

  const sim = useMemo(() => {
    void i18n.language;
    return simulate(scene, { testActive, supplyKind });
  }, [scene, testActive, supplyKind, i18n.language]);

  useEffect(() => {
    document.documentElement.lang = i18n.language;
    document.documentElement.dir =
      i18n.language === 'ar' ? 'rtl' : 'ltr';
  }, [i18n.language]);

  useEffect(() => {
    if (isAppLocale(i18n.language)) {
      persistLocale(i18n.language);
    }
  }, [i18n.language]);

  useEffect(() => {
    persistSupplyKind(supplyKind);
  }, [supplyKind]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        dispatch({ type: 'cancelWire' });
        setSettingsOpen(false);
        setSelectedIds(new Set());
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
        const el = e.target;
        if (
          el instanceof HTMLInputElement ||
          el instanceof HTMLTextAreaElement ||
          el instanceof HTMLSelectElement
        ) {
          return;
        }
        e.preventDefault();
        setSelectedIds(new Set(sceneRef.current.parts.map((p) => p.id)));
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    const valid = new Set(scene.parts.map((p) => p.id));
    setSelectedIds((prev) => {
      let changed = false;
      const next = new Set<PartId>();
      for (const id of prev) {
        if (valid.has(id)) {
          next.add(id);
        } else {
          changed = true;
        }
      }
      if (!changed && next.size === prev.size) {
        return prev;
      }
      return next;
    });
  }, [scene.parts]);

  const marqueeRectNorm = useMemo(
    () =>
      marquee
        ? normalizeMarqueeRect(
            marquee.x0,
            marquee.y0,
            marquee.x1,
            marquee.y1,
          )
        : null,
    [marquee],
  );

  const onBoardPointerDown = useCallback(
    (e: ReactPointerEvent<SVGRectElement>) => {
      if (e.button !== 0) return;
      const svg = svgRef.current;
      if (!svg) return;
      e.currentTarget.setPointerCapture(e.pointerId);
      const { x, y } = screenToBoard(
        e.clientX,
        e.clientY,
        svg,
        identityTransform,
      );
      marqueeStartRef.current = { x0: x, y0: y };
      setMarquee({ x0: x, y0: y, x1: x, y1: y });
    },
    [],
  );

  const onBoardPointerMove = useCallback(
    (e: ReactPointerEvent<SVGRectElement>) => {
      if (!marqueeStartRef.current) return;
      const svg = svgRef.current;
      if (!svg) return;
      const { x, y } = screenToBoard(
        e.clientX,
        e.clientY,
        svg,
        identityTransform,
      );
      const { x0, y0 } = marqueeStartRef.current;
      setMarquee({ x0, y0, x1: x, y1: y });
    },
    [],
  );

  const finishMarquee = useCallback(
    (
      e: ReactPointerEvent<SVGRectElement>,
      clientX: number,
      clientY: number,
    ) => {
      const start = marqueeStartRef.current;
      if (!start) return;
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      const svg = svgRef.current;
      if (!svg) return;
      const { x, y } = screenToBoard(
        clientX,
        clientY,
        svg,
        identityTransform,
      );
      const norm = normalizeMarqueeRect(start.x0, start.y0, x, y);
      const w = norm.maxX - norm.minX;
      const h = norm.maxY - norm.minY;
      const diag = Math.hypot(w, h);
      const parts = sceneRef.current.parts;

      if (diag < MARQUEE_CLICK_PX) {
        dispatch({ type: 'cancelWire' });
        if (!e.shiftKey) {
          setSelectedIds(new Set());
        }
      } else {
        const ids = partIdsInMarquee(parts, norm);
        const idSet = new Set(ids);
        if (e.shiftKey) {
          setSelectedIds((prev) => new Set([...prev, ...idSet]));
        } else {
          setSelectedIds(idSet);
        }
      }
      setMarquee(null);
      marqueeStartRef.current = null;
    },
    [],
  );

  const onBoardPointerUp = useCallback(
    (e: ReactPointerEvent<SVGRectElement>) => {
      finishMarquee(e, e.clientX, e.clientY);
    },
    [finishMarquee],
  );

  const onBoardPointerCancel = useCallback(
    (e: ReactPointerEvent<SVGRectElement>) => {
      if (!marqueeStartRef.current) return;
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      setMarquee(null);
      marqueeStartRef.current = null;
    },
    [],
  );

  const removeSelected = useCallback(() => {
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    dispatch({ type: 'deleteParts', partIds: ids });
    setSelectedIds(new Set());
  }, [selectedIds, dispatch]);

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

  const onRemoveWire = useCallback((wireId: WireId) => {
    dispatch({ type: 'deleteWire', wireId });
  }, []);

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
        <h1 className="app-title">{t('app.title')}</h1>
        <div className="app-controls">
          <button
            type="button"
            className={testActive ? 'btn btn--on' : 'btn'}
            aria-pressed={testActive}
            onClick={() => setTestActive((v) => !v)}
          >
            {testActive ? t('app.testOn') : t('app.testOff')}
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
          aria-label={t('app.boardSectionAria')}
        >
          <svg
            ref={svgRef}
            className="board-svg"
            viewBox={`0 0 ${BOARD_W} ${BOARD_H}`}
            role="img"
            aria-label={t('app.boardSvgAria')}
          >
            <rect
              className="board-bg"
              width={BOARD_W}
              height={BOARD_H}
              rx={12}
              onPointerDown={onBoardPointerDown}
              onPointerMove={onBoardPointerMove}
              onPointerUp={onBoardPointerUp}
              onPointerCancel={onBoardPointerCancel}
            />
            <WireLayer
              scene={scene}
              energizedWireIds={sim.energizedWireIds}
              testActive={sim.testActive}
              reducedMotion={reducedMotion}
              supplyKind={supplyKind}
              onRemoveWire={onRemoveWire}
            />
            {scene.parts.map((p) => (
              <PartView
                key={p.id}
                part={p}
                selected={selectedIds.has(p.id)}
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
            {marqueeRectNorm ? (
              <rect
                className="selection-marquee"
                x={marqueeRectNorm.minX}
                y={marqueeRectNorm.minY}
                width={marqueeRectNorm.maxX - marqueeRectNorm.minX}
                height={marqueeRectNorm.maxY - marqueeRectNorm.minY}
                rx={2}
              />
            ) : null}
            {selectedIds.size > 0 ? (
              <SelectionToolbar
                boardWidth={BOARD_W}
                count={selectedIds.size}
                onRemove={removeSelected}
              />
            ) : null}
          </svg>
          <p className="sr-only" role="status" aria-live="polite">
            {sim.statusMessage}
          </p>
        </section>
      </div>
    </div>
  );
}
