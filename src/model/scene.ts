import { partId, wireId, type PinId } from './ids';
import { allPinsForPart } from './pinLayout';
import type { Scene, SceneAction, WirePoint } from './types';

export function initialScene(): Scene {
  return {
    parts: [],
    wires: [],
    wireDraftFrom: null,
    wireDraftKind: 'live',
    nextPartIndex: 1,
    nextWireIndex: 1,
  };
}

export function sceneReducer(state: Scene, action: SceneAction): Scene {
  switch (action.type) {
    case 'addPart': {
      if (
        action.kind === 'ac_supply' &&
        state.parts.some((p) => p.kind === 'ac_supply')
      ) {
        return state;
      }
      const id = partId(`p${state.nextPartIndex}`);
      const base = {
        id,
        kind: action.kind,
        x: action.x,
        y: action.y,
        rotationDeg: 0,
        /** Switches start open (Off); user turns On to close the contact. */
        switchClosed: false,
        breakerOn: action.kind === 'breaker_2p',
      };
      return {
        ...state,
        parts: [...state.parts, base],
        nextPartIndex: state.nextPartIndex + 1,
      };
    }
    case 'movePart':
      return {
        ...state,
        parts: state.parts.map((p) =>
          p.id === action.partId ? { ...p, x: action.x, y: action.y } : p,
        ),
      };
    case 'setPartRotation':
      return {
        ...state,
        parts: state.parts.map((p) =>
          p.id === action.partId
            ? { ...p, rotationDeg: action.rotationDeg }
            : p,
        ),
      };
    case 'toggleSwitch':
      return {
        ...state,
        parts: state.parts.map((p) =>
          p.id === action.partId && p.kind === 'switch'
            ? { ...p, switchClosed: !p.switchClosed }
            : p,
        ),
      };
    case 'toggleBreaker':
      return {
        ...state,
        parts: state.parts.map((p) =>
          p.id === action.partId && p.kind === 'breaker_2p'
            ? { ...p, breakerOn: !p.breakerOn }
            : p,
        ),
      };
    case 'beginWire':
      return {
        ...state,
        wireDraftFrom: action.pin,
        wireDraftKind: action.kind,
      };
    case 'completeWire': {
      const a = state.wireDraftFrom;
      if (a === null || a === action.pin) {
        return {
          ...state,
          wireDraftFrom: null,
          wireDraftKind: 'live',
        };
      }
      const exists = state.wires.some(
        (w) =>
          (w.pinA === a && w.pinB === action.pin) ||
          (w.pinA === action.pin && w.pinB === a),
      );
      if (exists) {
        return {
          ...state,
          wireDraftFrom: null,
          wireDraftKind: 'live',
        };
      }
      const wid = wireId(`w${state.nextWireIndex}`);
      const wire = {
        id: wid,
        pinA: a,
        pinB: action.pin,
        kind: state.wireDraftKind,
      };
      return {
        ...state,
        wires: [...state.wires, wire],
        wireDraftFrom: null,
        wireDraftKind: 'live',
        nextWireIndex: state.nextWireIndex + 1,
      };
    }
    case 'cancelWire':
      return { ...state, wireDraftFrom: null, wireDraftKind: 'live' };
    case 'deleteWire':
      return {
        ...state,
        wires: state.wires.filter((w) => w.id !== action.wireId),
      };
    case 'setWireWaypoints': {
      const w = state.wires.find((x) => x.id === action.wireId);
      if (!w) return state;
      const cleaned: { x: number; y: number }[] = [];
      for (const p of action.waypoints) {
        if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) continue;
        cleaned.push({ x: p.x, y: p.y });
      }
      const nextWaypoints = cleaned as readonly WirePoint[];
      return {
        ...state,
        wires: state.wires.map((x) =>
          x.id === action.wireId
            ? {
                ...x,
                waypoints: nextWaypoints.length > 0 ? nextWaypoints : undefined,
              }
            : x,
        ),
      };
    }
    case 'deletePart': {
      const part = state.parts.find((p) => p.id === action.partId);
      if (!part) return state;
      const pinSet = new Set(allPinsForPart(part));
      return {
        ...state,
        parts: state.parts.filter((p) => p.id !== action.partId),
        wires: state.wires.filter(
          (w) => !pinSet.has(w.pinA) && !pinSet.has(w.pinB),
        ),
        wireDraftFrom:
          state.wireDraftFrom && pinSet.has(state.wireDraftFrom)
            ? null
            : state.wireDraftFrom,
        wireDraftKind:
          state.wireDraftFrom && pinSet.has(state.wireDraftFrom)
            ? 'live'
            : state.wireDraftKind,
      };
    }
    case 'deleteParts': {
      const remove = new Set(action.partIds);
      if (remove.size === 0) return state;
      const pinSet = new Set<PinId>();
      for (const p of state.parts) {
        if (remove.has(p.id)) {
          for (const pin of allPinsForPart(p)) {
            pinSet.add(pin);
          }
        }
      }
      return {
        ...state,
        parts: state.parts.filter((p) => !remove.has(p.id)),
        wires: state.wires.filter(
          (w) => !pinSet.has(w.pinA) && !pinSet.has(w.pinB),
        ),
        wireDraftFrom:
          state.wireDraftFrom && pinSet.has(state.wireDraftFrom)
            ? null
            : state.wireDraftFrom,
        wireDraftKind:
          state.wireDraftFrom && pinSet.has(state.wireDraftFrom)
            ? 'live'
            : state.wireDraftKind,
      };
    }
    default: {
      const _never: never = action;
      return _never;
    }
  }
}
