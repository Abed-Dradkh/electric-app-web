import { describe, expect, it } from 'vitest';
<<<<<<< HEAD
import { initialScene, sceneReducer } from './scene';
import { makePinId } from './pinLayout';
import { partId, wireId } from './ids';
=======
import { partId, wireId } from './ids';
import { makePinId } from './pinLayout';
import { initialScene, sceneReducer } from './scene';
>>>>>>> e1d5bf1 (updates)

describe('sceneReducer deleteParts', () => {
  it('removes multiple parts and their wires', () => {
    let s = initialScene();
    s = sceneReducer(s, { type: 'addPart', kind: 'battery', x: 0, y: 0 });
    s = sceneReducer(s, { type: 'addPart', kind: 'bulb', x: 100, y: 0 });
    const bat = s.parts[0]!;
    const bulb = s.parts[1]!;
<<<<<<< HEAD
    s = sceneReducer(s, { type: 'beginWire', pin: makePinId(bat.id, 'positive') });
=======
    s = sceneReducer(s, {
      type: 'beginWire',
      pin: makePinId(bat.id, 'positive'),
      kind: 'live',
    });
>>>>>>> e1d5bf1 (updates)
    s = sceneReducer(s, { type: 'completeWire', pin: makePinId(bulb.id, 'a') });
    expect(s.wires.length).toBe(1);

    s = sceneReducer(s, {
      type: 'deleteParts',
      partIds: [partId(bat.id), partId(bulb.id)],
    });
    expect(s.parts.length).toBe(0);
    expect(s.wires.length).toBe(0);
  });

  it('no-ops on empty part id list', () => {
    const s = initialScene();
    const next = sceneReducer(s, { type: 'deleteParts', partIds: [] });
    expect(next).toBe(s);
  });

  it('keeps unrelated parts and wires', () => {
    let s = initialScene();
    s = sceneReducer(s, { type: 'addPart', kind: 'battery', x: 0, y: 0 });
    s = sceneReducer(s, { type: 'addPart', kind: 'bulb', x: 100, y: 0 });
    s = sceneReducer(s, { type: 'addPart', kind: 'resistor', x: 200, y: 0 });
    const bat = s.parts[0]!;
    const bulb = s.parts[1]!;
    const res = s.parts[2]!;
<<<<<<< HEAD
    s = sceneReducer(s, { type: 'beginWire', pin: makePinId(bat.id, 'positive') });
    s = sceneReducer(s, { type: 'completeWire', pin: makePinId(bulb.id, 'a') });
    s = sceneReducer(s, { type: 'beginWire', pin: makePinId(bulb.id, 'b') });
=======
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
>>>>>>> e1d5bf1 (updates)
    s = sceneReducer(s, { type: 'completeWire', pin: makePinId(res.id, 'a') });

    s = sceneReducer(s, { type: 'deleteParts', partIds: [partId(bat.id)] });
    expect(s.parts.map((p) => p.id)).toEqual([bulb.id, res.id]);
    expect(s.wires.length).toBe(1);
    expect(s.wires[0]!.id).toBe(wireId('w2'));
  });
});
