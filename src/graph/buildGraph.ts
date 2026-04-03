<<<<<<< HEAD
import type { CircuitGraph, GraphEdge } from './types';
import type { Scene } from '../model/types';
import { makePinId } from '../model/pinLayout';
=======
import { makePinId } from '../model/pinLayout';
import type { Scene } from '../model/types';
import type { CircuitGraph, GraphEdge } from './types';
>>>>>>> e1d5bf1 (updates)

function internalId(partId: string, suffix: string): string {
  return `int:${partId}:${suffix}`;
}

/**
 * Builds an undirected conducting graph from the scene (wires + closed
 * component internals).
 */
export function buildGraph(scene: Scene): CircuitGraph {
  const edges: GraphEdge[] = [];

  for (const w of scene.wires) {
    edges.push({
      id: `wire:${w.id}`,
      a: w.pinA,
      b: w.pinB,
      kind: 'wire',
      wireId: w.id,
    });
  }

  for (const p of scene.parts) {
    switch (p.kind) {
      case 'battery':
      case 'ac_supply':
        break;
      case 'bulb':
      case 'resistor':
      case 'led': {
        const a = makePinId(p.id, 'a');
        const b = makePinId(p.id, 'b');
        edges.push({
          id: internalId(p.id, 'body'),
          a,
          b,
          kind: 'internal',
          wireId: null,
        });
        break;
      }
      case 'switch': {
        if (p.switchClosed) {
          const a = makePinId(p.id, 'a');
          const b = makePinId(p.id, 'b');
          edges.push({
            id: internalId(p.id, 'contact'),
            a,
            b,
            kind: 'internal',
            wireId: null,
          });
        }
        break;
      }
      case 'breaker_2p': {
        if (p.breakerOn) {
          const lIn = makePinId(p.id, 'l_in');
          const lOut = makePinId(p.id, 'l_out');
          const nIn = makePinId(p.id, 'n_in');
          const nOut = makePinId(p.id, 'n_out');
          edges.push({
            id: internalId(p.id, 'l_conn'),
            a: lIn,
            b: lOut,
            kind: 'internal',
            wireId: null,
          });
          edges.push({
            id: internalId(p.id, 'n_conn'),
            a: nIn,
            b: nOut,
            kind: 'internal',
            wireId: null,
          });
        }
        break;
      }
    }
  }

  return { edges };
}
