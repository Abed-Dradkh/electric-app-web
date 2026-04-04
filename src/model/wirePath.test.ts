import { describe, expect, it } from 'vitest';
import { partId, wireId } from './ids';
import { makePinId } from './pinLayout';
import { initialScene, sceneReducer } from './scene';
import type { Scene, Wire } from './types';
import {
  buildWirePolyline,
  findClosestSegmentOnPolyline,
  insertWaypointAtSegment,
  midpointAlongPolyline,
  polylineToSvgPath,
  snapToGrid,
} from './wirePath';

describe('snapToGrid', () => {
  it('rounds to GRID_STEP', () => {
    expect(snapToGrid(7, 13)).toEqual({ x: 0, y: 20 });
    expect(snapToGrid(10, 10, 20)).toEqual({ x: 20, y: 20 });
  });
});

describe('polylineToSvgPath', () => {
  it('builds M/L chain', () => {
    expect(
      polylineToSvgPath([
        { x: 0, y: 0 },
        { x: 10, y: 20 },
      ]),
    ).toBe('M 0 0 L 10 20');
  });
});

describe('midpointAlongPolyline', () => {
  it('places hint at half length', () => {
    const m = midpointAlongPolyline([
      { x: 0, y: 0 },
      { x: 100, y: 0 },
    ]);
    expect(m.midX).toBeCloseTo(50);
    expect(m.midY).toBeCloseTo(0);
  });
});

describe('insertWaypointAtSegment', () => {
  it('inserts at segment index', () => {
    const a = { x: 0, y: 0 };
    const b = { x: 20, y: 0 };
    expect(insertWaypointAtSegment([], 0, a)).toEqual([a]);
    expect(insertWaypointAtSegment([a], 1, b)).toEqual([a, b]);
  });
});

describe('findClosestSegmentOnPolyline', () => {
  it('finds nearest segment', () => {
    const poly = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
    ];
    const hit = findClosestSegmentOnPolyline(poly, 50, 5);
    expect(hit?.segmentIndex).toBe(0);
    expect(hit?.closest.x).toBeCloseTo(50);
  });
});

function sceneWithOneWire(): { scene: Scene; wire: Wire } {
  let s = initialScene();
  s = sceneReducer(s, { type: 'addPart', kind: 'battery', x: 100, y: 100 });
  s = sceneReducer(s, { type: 'addPart', kind: 'bulb', x: 300, y: 100 });
  const bat = s.parts[0]!;
  const bulb = s.parts[1]!;
  s = sceneReducer(s, {
    type: 'beginWire',
    pin: makePinId(bat.id, 'positive'),
    kind: 'live',
  });
  s = sceneReducer(s, { type: 'completeWire', pin: makePinId(bulb.id, 'a') });
  const wire = s.wires[0]!;
  return { scene: s, wire };
}

describe('buildWirePolyline', () => {
  it('includes waypoints between pins', () => {
    const { scene, wire } = sceneWithOneWire();
    const w: Wire = {
      ...wire,
      waypoints: [{ x: 200, y: 80 }],
    };
    const poly = buildWirePolyline(scene, w);
    expect(poly?.length).toBe(3);
    expect(poly?.[1]).toEqual({ x: 200, y: 80 });
  });
});

describe('sceneReducer setWireWaypoints', () => {
  it('stores waypoints and clears when empty', () => {
    const { scene: s0, wire } = sceneWithOneWire();
    let scene = s0;
    scene = sceneReducer(scene, {
      type: 'setWireWaypoints',
      wireId: wire.id,
      waypoints: [{ x: 0, y: 0 }],
    });
    expect(scene.wires[0]?.waypoints).toEqual([{ x: 0, y: 0 }]);
    scene = sceneReducer(scene, {
      type: 'setWireWaypoints',
      wireId: wire.id,
      waypoints: [],
    });
    expect(scene.wires[0]?.waypoints).toBeUndefined();
  });

  it('ignores unknown wire id', () => {
    const { scene } = sceneWithOneWire();
    const next = sceneReducer(scene, {
      type: 'setWireWaypoints',
      wireId: wireId('w999'),
      waypoints: [{ x: 1, y: 2 }],
    });
    expect(next).toBe(scene);
  });
});

describe('waypoints survive unrelated part move', () => {
  it('keeps wire waypoints when another part moves', () => {
    let s = initialScene();
    s = sceneReducer(s, { type: 'addPart', kind: 'battery', x: 100, y: 100 });
    s = sceneReducer(s, { type: 'addPart', kind: 'bulb', x: 300, y: 100 });
    s = sceneReducer(s, { type: 'addPart', kind: 'resistor', x: 400, y: 400 });
    const bat = s.parts[0]!;
    const bulb = s.parts[1]!;
    const res = s.parts[2]!;
    s = sceneReducer(s, {
      type: 'beginWire',
      pin: makePinId(bat.id, 'positive'),
      kind: 'live',
    });
    s = sceneReducer(s, { type: 'completeWire', pin: makePinId(bulb.id, 'a') });
    const wid = s.wires[0]!.id;
    s = sceneReducer(s, {
      type: 'setWireWaypoints',
      wireId: wid,
      waypoints: [{ x: 200, y: 200 }],
    });
    s = sceneReducer(s, {
      type: 'movePart',
      partId: partId(res.id),
      x: 500,
      y: 500,
    });
    expect(s.wires[0]?.waypoints).toEqual([{ x: 200, y: 200 }]);
  });
});
