import type { PointerEvent as ReactPointerEvent } from 'react';
import {
    useCallback,
    useEffect,
    useMemo,
    useReducer,
    useRef,
    useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useReducedMotion } from '../hooks/useReducedMotion';
import type { PartId, PinId, WireId } from '../model/ids';
import { pinWorldPosition } from '../model/pinLayout';
import { initialScene, sceneReducer } from '../model/scene';
import {
    normalizeMarqueeRect,
    partIdsInMarquee,
} from '../model/selectionBounds';
import type { SupplyKind } from '../model/supplyKind';
import type { ComponentKind, WireKind } from '../model/types';
import {
    buildWirePolyline,
    findClosestSegmentOnPolyline,
    GRID_STEP,
    insertWaypointAtSegment,
    snapToGrid,
} from '../model/wirePath';
import { simulate } from '../sim';
import {
    angleFromCenterDeg,
    identityTransform,
    normalizeDeg,
    screenToBoard,
} from '../ui/coords';
import { HeaderSettings } from '../ui/HeaderSettings';
import { useTheme } from '../ui/themeContext';
import { isAppLocale, persistLocale } from '../ui/localeStorage';
import { Palette } from '../ui/palette/Palette';
import { PartStylesIcon, PlayIcon } from '../ui/workshopRedesignIcons';
import type { WorkshopLayoutVariant } from '../ui/workshopLayoutVariantStorage';
import {
    loadStoredWorkshopLayoutVariant,
    persistWorkshopLayoutVariant,
} from '../ui/workshopLayoutVariantStorage';
import {
    loadStoredHoverBarPosition,
    loadStoredRotateHandlePosition,
    type PartHoverBarPosition,
    type RotateHandlePosition,
} from '../ui/partHoverLayout';
import { PartView } from '../ui/parts/PartView';
import {
    loadStoredPinLabelsVisible,
    persistPinLabelsVisible,
} from '../ui/pinLabelVisibilityStorage';
import { SelectionToolbar } from '../ui/SelectionToolbar';
import {
    loadStoredSupplyKind,
    persistSupplyKind,
} from '../ui/supplyKindStorage';
import { WireColorPickerOverlay } from '../ui/wires/WireColorPickerOverlay';
import { WireHandles, type WireWaypointPreview } from '../ui/wires/WireHandles';
import { WireLayer } from '../ui/wires/WireLayer';

const BOARD_W = 800;
const BOARD_H = 600;

/** Drag length below this (board px) counts as a click, not a marquee. */
const MARQUEE_CLICK_PX = 6;

export function WorkshopPage() {
  const { t, i18n } = useTranslation();
  const { preference: colorSchemePreference, setPreference: setColorSchemePreference } =
    useTheme();
  const [scene, dispatch] = useReducer(sceneReducer, initialScene());
  const [testActive, setTestActive] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [hoverBarPosition, setHoverBarPosition] =
    useState<PartHoverBarPosition>(() => loadStoredHoverBarPosition() ?? 'up');
  const [rotateHandlePosition, setRotateHandlePosition] =
    useState<RotateHandlePosition>(
      () => loadStoredRotateHandlePosition() ?? 'right',
    );
  const [pinLabelsVisible, setPinLabelsVisible] = useState(() =>
    loadStoredPinLabelsVisible(),
  );
  const [supplyKind, setSupplyKind] = useState<SupplyKind>(
    () => loadStoredSupplyKind() ?? 'dc',
  );
  const [workshopLayoutVariant, setWorkshopLayoutVariant] =
    useState<WorkshopLayoutVariant>(
      () => loadStoredWorkshopLayoutVariant() ?? 'v1',
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
  const [wireColorPicker, setWireColorPicker] = useState<{
    pin: PinId;
    x: number;
    y: number;
  } | null>(null);
  const wireColorPickerRef = useRef(wireColorPicker);
  wireColorPickerRef.current = wireColorPicker;

  const [selectedWireId, setSelectedWireId] = useState<WireId | null>(null);
  const [waypointPreview, setWaypointPreview] =
    useState<WireWaypointPreview | null>(null);
  const waypointDragRef = useRef<{
    wireId: WireId;
    internalIndex: number;
  } | null>(null);
  const waypointDragBoardRef = useRef<{ x: number; y: number } | null>(null);
  const selectedWireIdRef = useRef<WireId | null>(null);
  selectedWireIdRef.current = selectedWireId;

  const sim = useMemo(() => {
    void i18n.language;
    return simulate(scene, { testActive, supplyKind });
  }, [scene, testActive, supplyKind, i18n.language]);

  useEffect(() => {
    document.documentElement.lang = i18n.language;
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
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
    persistWorkshopLayoutVariant(workshopLayoutVariant);
  }, [workshopLayoutVariant]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        dispatch({ type: 'cancelWire' });
        setWireColorPicker(null);
        setSettingsOpen(false);
        setSelectedIds(new Set());
        setSelectedWireId(null);
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const el = e.target;
        if (
          el instanceof HTMLInputElement ||
          el instanceof HTMLTextAreaElement ||
          el instanceof HTMLSelectElement
        ) {
          return;
        }
        const wid = selectedWireIdRef.current;
        if (wid) {
          e.preventDefault();
          dispatch({ type: 'deleteWire', wireId: wid });
          setSelectedWireId(null);
        }
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
    const validWires = new Set(scene.wires.map((w) => w.id));
    setSelectedWireId((wid) => (wid && validWires.has(wid) ? wid : null));
  }, [scene.wires]);

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
        ? normalizeMarqueeRect(marquee.x0, marquee.y0, marquee.x1, marquee.y1)
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
      const { x, y } = screenToBoard(clientX, clientY, svg, identityTransform);
      const norm = normalizeMarqueeRect(start.x0, start.y0, x, y);
      const w = norm.maxX - norm.minX;
      const h = norm.maxY - norm.minY;
      const diag = Math.hypot(w, h);
      const parts = sceneRef.current.parts;

      if (diag < MARQUEE_CLICK_PX) {
        dispatch({ type: 'cancelWire' });
        setWireColorPicker(null);
        setSelectedWireId(null);
        if (!e.shiftKey) {
          setSelectedIds(new Set());
        }
      } else {
        setSelectedWireId(null);
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

  const addPart = useCallback(
    (kind: ComponentKind) => {
      const n = scene.parts.length;
      const x = 160 + (n % 4) * 140;
      const y = 160 + Math.floor(n / 4) * 100;
      dispatch({ type: 'addPart', kind, x, y });
    },
    [scene.parts.length],
  );

  const onPinClick = useCallback(
    (pin: PinId) => {
      setSelectedWireId(null);
      if (scene.wireDraftFrom !== null) {
        dispatch({ type: 'completeWire', pin });
        return;
      }
      const pos = pinWorldPosition(scene, pin);
      if (!pos) return;
      setWireColorPicker({ pin, x: pos.x, y: pos.y });
    },
    [scene],
  );

  const onPickWireKind = useCallback(
    (kind: WireKind) => {
      const open = wireColorPickerRef.current;
      if (!open) return;
      dispatch({ type: 'beginWire', pin: open.pin, kind });
      setWireColorPicker(null);
    },
    [dispatch],
  );

  const onRemoveWire = useCallback((wireId: WireId) => {
    dispatch({ type: 'deleteWire', wireId });
    setSelectedWireId((prev) => (prev === wireId ? null : prev));
  }, []);

  const onSelectWire = useCallback((wireId: WireId) => {
    setSelectedWireId(wireId);
    setSelectedIds(new Set());
  }, []);

  const onWireSegmentDoubleClick = useCallback(
    (wireId: WireId, clientX: number, clientY: number) => {
      const svg = svgRef.current;
      if (!svg) return;
      const { x, y } = screenToBoard(clientX, clientY, svg, identityTransform);
      const wire = sceneRef.current.wires.find((w) => w.id === wireId);
      if (!wire) return;
      const poly = buildWirePolyline(sceneRef.current, wire);
      if (!poly || poly.length < 2) return;
      const hit = findClosestSegmentOnPolyline(poly, x, y);
      if (!hit) return;
      const snapped = snapToGrid(hit.closest.x, hit.closest.y);
      const next = insertWaypointAtSegment(
        wire.waypoints ?? [],
        hit.segmentIndex,
        snapped,
      );
      dispatch({ type: 'setWireWaypoints', wireId, waypoints: next });
    },
    [dispatch],
  );

  const onWaypointPointerDown = useCallback(
    (
      wireId: WireId,
      internalIndex: number,
      e: ReactPointerEvent<SVGCircleElement>,
    ) => {
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      waypointDragRef.current = { wireId, internalIndex };
      const svg = svgRef.current;
      if (!svg) return;
      const { x, y } = screenToBoard(
        e.clientX,
        e.clientY,
        svg,
        identityTransform,
      );
      waypointDragBoardRef.current = { x, y };
      setWaypointPreview({ wireId, internalIndex, x, y });
    },
    [],
  );

  const onBodyPointerDown = useCallback(
    (partId: PartId, e: ReactPointerEvent<SVGRectElement>) => {
      setSelectedWireId(null);
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
      const wp = waypointDragRef.current;
      if (wp && svg) {
        const { x, y } = screenToBoard(
          e.clientX,
          e.clientY,
          svg,
          identityTransform,
        );
        waypointDragBoardRef.current = { x, y };
        setWaypointPreview({
          wireId: wp.wireId,
          internalIndex: wp.internalIndex,
          x,
          y,
        });
        return;
      }
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
      const wDrag = waypointDragRef.current;
      if (wDrag) {
        waypointDragRef.current = null;
        const board = waypointDragBoardRef.current;
        waypointDragBoardRef.current = null;
        setWaypointPreview(null);
        if (board) {
          const snapped = snapToGrid(board.x, board.y);
          const wire = sceneRef.current.wires.find(
            (w) => w.id === wDrag.wireId,
          );
          if (wire) {
            const wps = [...(wire.waypoints ?? [])];
            if (wDrag.internalIndex >= 0 && wDrag.internalIndex < wps.length) {
              wps[wDrag.internalIndex] = snapped;
              dispatch({
                type: 'setWireWaypoints',
                wireId: wDrag.wireId,
                waypoints: wps,
              });
            }
          }
        }
        return;
      }
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
  }, [dispatch]);

  const rootClass =
    workshopLayoutVariant === 'v2'
      ? 'workshop-redesign workshop-redesign--v2'
      : 'workshop-redesign';

  return (
    <div className={rootClass}>
      <header className="workshop-redesign-header">
        <h1 className="workshop-redesign-title">
          {workshopLayoutVariant === 'v2'
            ? t('redesign.titleV2')
            : t('redesign.titleV1')}
        </h1>
        <div className="workshop-redesign-header-actions">
          <Link
            className="workshop-redesign-pill workshop-redesign-pill--gold"
            to="/styles"
          >
            <PartStylesIcon />
            {t('app.navStyles')}
          </Link>
          <button
            type="button"
            className={
              testActive
                ? 'workshop-redesign-pill workshop-redesign-pill--gold workshop-redesign-pill--test-on'
                : 'workshop-redesign-pill workshop-redesign-pill--gold'
            }
            aria-pressed={testActive}
            aria-label={testActive ? t('app.testOn') : t('app.testOff')}
            onClick={() => setTestActive((v) => !v)}
          >
            <PlayIcon />
            {t('redesign.testLabel')}
          </button>
          <HeaderSettings
            open={settingsOpen}
            onOpenChange={setSettingsOpen}
            hoverBarPosition={hoverBarPosition}
            onHoverBarPositionChange={setHoverBarPosition}
            rotateHandlePosition={rotateHandlePosition}
            onRotateHandlePositionChange={setRotateHandlePosition}
            pinLabelsVisible={pinLabelsVisible}
            onPinLabelsVisibleChange={(v) => {
              setPinLabelsVisible(v);
              persistPinLabelsVisible(v);
            }}
            workshopLayoutVariant={workshopLayoutVariant}
            onWorkshopLayoutVariantChange={setWorkshopLayoutVariant}
            colorSchemePreference={colorSchemePreference}
            onColorSchemePreferenceChange={setColorSchemePreference}
            settingsTrigger="redesign"
          />
        </div>
      </header>
      <div className="workshop-redesign-body">
        <Palette
          appearance="redesign"
          supplyKind={supplyKind}
          onSupplyKindChange={setSupplyKind}
          onAdd={addPart}
        />
        <section
          className="workshop-redesign-board-wrap"
          aria-label={t('app.boardSectionAria')}
        >
          <div className="workshop-redesign-board workshop-redesign-board--live">
            {/* none: stretch viewBox to the panel so marquee/hits cover the full workspace (meet left letterboxed gaps). */}
            <svg
              ref={svgRef}
              className="board-svg board-svg--redesign"
              viewBox={`0 0 ${BOARD_W} ${BOARD_H}`}
              preserveAspectRatio="none"
              role="img"
              aria-label={t('app.boardSvgAria')}
            >
            <defs>
              <pattern
                id="workshop-board-grid"
                width={GRID_STEP}
                height={GRID_STEP}
                patternUnits="userSpaceOnUse"
              >
                <path
                  className="board-grid-pattern-path"
                  d={`M ${GRID_STEP} 0 L 0 0 0 ${GRID_STEP}`}
                  fill="none"
                />
              </pattern>
            </defs>
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
            <rect
              className="board-grid-overlay"
              width={BOARD_W}
              height={BOARD_H}
              rx={12}
              fill="url(#workshop-board-grid)"
              pointerEvents="none"
            />
            <WireLayer
              scene={scene}
              energizedWireIds={sim.energizedWireIds}
              testActive={sim.testActive}
              reducedMotion={reducedMotion}
              supplyKind={supplyKind}
              selectedWireId={selectedWireId}
              waypointPreview={waypointPreview}
              onSelectWire={onSelectWire}
              onRemoveWire={onRemoveWire}
              onWireSegmentDoubleClick={onWireSegmentDoubleClick}
            />
            {scene.parts.map((p) => (
              <PartView
                key={p.id}
                part={p}
                selected={selectedIds.has(p.id)}
                hint={sim.partHints.get(p.id)}
                testActive={sim.testActive}
                reducedMotion={reducedMotion}
                draftPin={scene.wireDraftFrom}
                showPinLabels={pinLabelsVisible}
                hoverBarPosition={hoverBarPosition}
                rotateHandlePosition={rotateHandlePosition}
                onPinClick={onPinClick}
                onBodyPointerDown={(e) => onBodyPointerDown(p.id, e)}
                onRemove={() => dispatch({ type: 'deletePart', partId: p.id })}
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
            <WireHandles
              scene={scene}
              selectedWireId={selectedWireId}
              preview={waypointPreview}
              onWaypointPointerDown={onWaypointPointerDown}
            />
            {wireColorPicker ? (
              <WireColorPickerOverlay
                anchorX={wireColorPicker.x}
                anchorY={wireColorPicker.y}
                onPick={onPickWireKind}
              />
            ) : null}
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
          </div>
        </section>
      </div>
    </div>
  );
}
