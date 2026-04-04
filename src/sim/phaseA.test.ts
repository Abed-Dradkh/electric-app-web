import { describe, expect, it } from 'vitest';
import { partId, wireId } from '../model/ids';
import { makePinId } from '../model/pinLayout';
import { initialScene, sceneReducer } from '../model/scene';
import type { Scene } from '../model/types';
import { simulate } from './phaseA';

function sceneWithLoop(): { scene: Scene; wireIds: string[] } {
  let s = initialScene();
  s = sceneReducer(s, { type: 'addPart', kind: 'battery', x: 100, y: 200 });
  s = sceneReducer(s, { type: 'addPart', kind: 'bulb', x: 300, y: 200 });
  const bat = s.parts[0]!;
  const bulb = s.parts[1]!;
  s = sceneReducer(s, {
    type: 'beginWire',
    pin: makePinId(bat.id, 'positive'),
    kind: 'live',
  });
  s = sceneReducer(s, { type: 'completeWire', pin: makePinId(bulb.id, 'a') });
  s = sceneReducer(s, {
    type: 'beginWire',
    pin: makePinId(bulb.id, 'b'),
    kind: 'live',
  });
  s = sceneReducer(s, {
    type: 'completeWire',
    pin: makePinId(bat.id, 'negative'),
  });
  const wids = s.wires.map((w) => w.id);
  return { scene: s, wireIds: wids };
}

describe('simulate Phase A', () => {
  it('reports no loop when test is off', () => {
    const { scene } = sceneWithLoop();
    const r = simulate(scene, { testActive: false });
    expect(r.testActive).toBe(false);
    expect(r.isCompleteLoop).toBe(false);
    expect(r.energizedWireIds.size).toBe(0);
    expect(r.supplyReachWireIds.size).toBe(0);
  });

  it('shows AC supply as live when test is on even without L–N path', () => {
    let s = initialScene();
    s = sceneReducer(s, { type: 'addPart', kind: 'ac_supply', x: 80, y: 200 });
    const ac = s.parts[0]!;
    const r = simulate(s, { testActive: true, supplyKind: 'ac' });
    expect(r.isCompleteLoop).toBe(false);
    expect(r.partHints.get(partId(ac.id))?.batterySupplying).toBe(true);
  });

  it('detects a simple battery–bulb loop', () => {
    const { scene, wireIds } = sceneWithLoop();
    const r = simulate(scene, { testActive: true });
    expect(r.isCompleteLoop).toBe(true);
    expect(wireIds.every((id) => r.energizedWireIds.has(wireId(id)))).toBe(
      true,
    );
    expect(wireIds.every((id) => r.supplyReachWireIds.has(wireId(id)))).toBe(
      true,
    );
    for (const id of r.energizedWireIds) {
      expect(r.supplyReachWireIds.has(id)).toBe(true);
    }
  });

  it('detects AC L–N loop through breaker, switch, and lamp', () => {
    let s = initialScene();
    s = sceneReducer(s, { type: 'addPart', kind: 'ac_supply', x: 80, y: 200 });
    s = sceneReducer(s, {
      type: 'addPart',
      kind: 'breaker_2p',
      x: 200,
      y: 200,
    });
    s = sceneReducer(s, { type: 'addPart', kind: 'switch', x: 320, y: 200 });
    s = sceneReducer(s, { type: 'addPart', kind: 'bulb', x: 460, y: 200 });
    const ac = s.parts[0]!;
    const br = s.parts[1]!;
    const sw = s.parts[2]!;
    const bulb = s.parts[3]!;
    s = sceneReducer(s, {
      type: 'beginWire',
      pin: makePinId(ac.id, 'l'),
      kind: 'live',
    });
    s = sceneReducer(s, {
      type: 'completeWire',
      pin: makePinId(br.id, 'l_in'),
    });
    s = sceneReducer(s, {
      type: 'beginWire',
      pin: makePinId(br.id, 'l_out'),
      kind: 'live',
    });
    s = sceneReducer(s, { type: 'completeWire', pin: makePinId(sw.id, 'a') });
    s = sceneReducer(s, {
      type: 'beginWire',
      pin: makePinId(sw.id, 'b'),
      kind: 'live',
    });
    s = sceneReducer(s, { type: 'completeWire', pin: makePinId(bulb.id, 'a') });
    s = sceneReducer(s, {
      type: 'beginWire',
      pin: makePinId(bulb.id, 'b'),
      kind: 'live',
    });
    s = sceneReducer(s, {
      type: 'completeWire',
      pin: makePinId(br.id, 'n_out'),
    });
    s = sceneReducer(s, {
      type: 'beginWire',
      pin: makePinId(br.id, 'n_in'),
      kind: 'live',
    });
    s = sceneReducer(s, { type: 'completeWire', pin: makePinId(ac.id, 'n') });
    s = sceneReducer(s, { type: 'toggleSwitch', partId: sw.id });
    const wids = s.wires.map((w) => w.id);
    const r = simulate(s, { testActive: true, supplyKind: 'ac' });
    expect(r.isCompleteLoop).toBe(true);
    expect(wids.every((id) => r.energizedWireIds.has(wireId(id)))).toBe(true);
  });

  it('breaks AC loop when 2-pole breaker is off', () => {
    let s = initialScene();
    s = sceneReducer(s, { type: 'addPart', kind: 'ac_supply', x: 80, y: 200 });
    s = sceneReducer(s, {
      type: 'addPart',
      kind: 'breaker_2p',
      x: 200,
      y: 200,
    });
    s = sceneReducer(s, { type: 'addPart', kind: 'switch', x: 320, y: 200 });
    s = sceneReducer(s, { type: 'addPart', kind: 'bulb', x: 460, y: 200 });
    const ac = s.parts[0]!;
    const br = s.parts[1]!;
    const sw = s.parts[2]!;
    const bulb = s.parts[3]!;
    s = sceneReducer(s, { type: 'toggleBreaker', partId: br.id });
    s = sceneReducer(s, {
      type: 'beginWire',
      pin: makePinId(ac.id, 'l'),
      kind: 'live',
    });
    s = sceneReducer(s, {
      type: 'completeWire',
      pin: makePinId(br.id, 'l_in'),
    });
    s = sceneReducer(s, {
      type: 'beginWire',
      pin: makePinId(br.id, 'l_out'),
      kind: 'live',
    });
    s = sceneReducer(s, { type: 'completeWire', pin: makePinId(sw.id, 'a') });
    s = sceneReducer(s, {
      type: 'beginWire',
      pin: makePinId(sw.id, 'b'),
      kind: 'live',
    });
    s = sceneReducer(s, { type: 'completeWire', pin: makePinId(bulb.id, 'a') });
    s = sceneReducer(s, {
      type: 'beginWire',
      pin: makePinId(bulb.id, 'b'),
      kind: 'live',
    });
    s = sceneReducer(s, {
      type: 'completeWire',
      pin: makePinId(br.id, 'n_out'),
    });
    s = sceneReducer(s, {
      type: 'beginWire',
      pin: makePinId(br.id, 'n_in'),
      kind: 'live',
    });
    s = sceneReducer(s, { type: 'completeWire', pin: makePinId(ac.id, 'n') });
    const r = simulate(s, { testActive: true, supplyKind: 'ac' });
    expect(r.isCompleteLoop).toBe(false);
    expect(r.energizedWireIds.size).toBe(0);
    const acToBr = s.wires[0]!;
    expect(r.supplyReachWireIds.has(wireId(acToBr.id))).toBe(true);
  });

  it('breaks the loop when switch is open', () => {
    let s = initialScene();
    s = sceneReducer(s, { type: 'addPart', kind: 'battery', x: 80, y: 200 });
    s = sceneReducer(s, { type: 'addPart', kind: 'switch', x: 220, y: 200 });
    s = sceneReducer(s, { type: 'addPart', kind: 'bulb', x: 380, y: 200 });
    const bat = s.parts[0]!;
    const sw = s.parts[1]!;
    const bulb = s.parts[2]!;
    s = sceneReducer(s, {
      type: 'beginWire',
      pin: makePinId(bat.id, 'positive'),
      kind: 'live',
    });
    s = sceneReducer(s, { type: 'completeWire', pin: makePinId(sw.id, 'a') });
    s = sceneReducer(s, {
      type: 'beginWire',
      pin: makePinId(sw.id, 'b'),
      kind: 'live',
    });
    s = sceneReducer(s, { type: 'completeWire', pin: makePinId(bulb.id, 'a') });
    s = sceneReducer(s, {
      type: 'beginWire',
      pin: makePinId(bulb.id, 'b'),
      kind: 'live',
    });
    s = sceneReducer(s, {
      type: 'completeWire',
      pin: makePinId(bat.id, 'negative'),
    });
    const r = simulate(s, { testActive: true });
    expect(r.isCompleteLoop).toBe(false);
    expect(r.energizedWireIds.size).toBe(0);
    const w0 = s.wires[0];
    expect(w0).toBeDefined();
    expect(r.supplyReachWireIds.has(wireId(w0!.id))).toBe(true);
    expect(r.supplyReachWireIds.size).toBe(1);
  });
});
