import { describe, expect, it } from 'vitest';
import { initialScene, sceneReducer } from '../model/scene';
import type { Scene } from '../model/types';
import { makePinId } from '../model/pinLayout';
import { wireId } from '../model/ids';
import { simulate } from './phaseA';

function sceneWithLoop(): { scene: Scene; wireIds: string[] } {
  let s = initialScene();
  s = sceneReducer(s, { type: 'addPart', kind: 'battery', x: 100, y: 200 });
  s = sceneReducer(s, { type: 'addPart', kind: 'bulb', x: 300, y: 200 });
  const bat = s.parts[0]!;
  const bulb = s.parts[1]!;
  s = sceneReducer(s, { type: 'beginWire', pin: makePinId(bat.id, 'positive') });
  s = sceneReducer(s, { type: 'completeWire', pin: makePinId(bulb.id, 'a') });
  s = sceneReducer(s, { type: 'beginWire', pin: makePinId(bulb.id, 'b') });
  s = sceneReducer(s, { type: 'completeWire', pin: makePinId(bat.id, 'negative') });
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
  });

  it('detects a simple battery–bulb loop', () => {
    const { scene, wireIds } = sceneWithLoop();
    const r = simulate(scene, { testActive: true });
    expect(r.isCompleteLoop).toBe(true);
    expect(wireIds.every((id) => r.energizedWireIds.has(wireId(id)))).toBe(
      true,
    );
  });

  it('breaks the loop when switch is open', () => {
    let s = initialScene();
    s = sceneReducer(s, { type: 'addPart', kind: 'battery', x: 80, y: 200 });
    s = sceneReducer(s, { type: 'addPart', kind: 'switch', x: 220, y: 200 });
    s = sceneReducer(s, { type: 'addPart', kind: 'bulb', x: 380, y: 200 });
    const bat = s.parts[0]!;
    const sw = s.parts[1]!;
    const bulb = s.parts[2]!;
    s = sceneReducer(s, { type: 'toggleSwitch', partId: sw.id });
    s = sceneReducer(s, { type: 'beginWire', pin: makePinId(bat.id, 'positive') });
    s = sceneReducer(s, { type: 'completeWire', pin: makePinId(sw.id, 'a') });
    s = sceneReducer(s, { type: 'beginWire', pin: makePinId(sw.id, 'b') });
    s = sceneReducer(s, { type: 'completeWire', pin: makePinId(bulb.id, 'a') });
    s = sceneReducer(s, { type: 'beginWire', pin: makePinId(bulb.id, 'b') });
    s = sceneReducer(s, { type: 'completeWire', pin: makePinId(bat.id, 'negative') });
    const r = simulate(s, { testActive: true });
    expect(r.isCompleteLoop).toBe(false);
    expect(r.energizedWireIds.size).toBe(0);
  });
});
