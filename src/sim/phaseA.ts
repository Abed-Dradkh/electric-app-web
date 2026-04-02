import { buildGraph } from '../graph/buildGraph';
import type { GraphEdge } from '../graph/types';
import { makePinId } from '../model/pinLayout';
import type { Scene } from '../model/types';
import type { PartId, PinId } from '../model/ids';
import { partId } from '../model/ids';
import type { PartSimHint, SimResult, SimulateOptions } from './types';

function neighborsFromEdges(
  edges: readonly GraphEdge[],
): Map<PinId, { peer: PinId; edge: GraphEdge }[]> {
  const m = new Map<PinId, { peer: PinId; edge: GraphEdge }[]>();
  const add = (u: PinId, v: PinId, e: GraphEdge) => {
    const arr = m.get(u) ?? [];
    arr.push({ peer: v, edge: e });
    m.set(u, arr);
  };
  for (const e of edges) {
    add(e.a, e.b, e);
    add(e.b, e.a, e);
  }
  return m;
}

function bfsDist(
  start: PinId,
  neighbors: Map<PinId, { peer: PinId; edge: GraphEdge }[]>,
): Map<PinId, number> {
  const dist = new Map<PinId, number>();
  const q: PinId[] = [start];
  dist.set(start, 0);
  while (q.length > 0) {
    const u = q.shift()!;
    const du = dist.get(u)!;
    for (const { peer } of neighbors.get(u) ?? []) {
      if (!dist.has(peer)) {
        dist.set(peer, du + 1);
        q.push(peer);
      }
    }
  }
  return dist;
}

function edgeOnShortestPath(
  e: GraphEdge,
  distP: Map<PinId, number>,
  distN: Map<PinId, number>,
  dTotal: number,
): boolean {
  const du = (x: PinId) => distP.get(x);
  const dv = (x: PinId) => distN.get(x);
  const u = e.a;
  const v = e.b;
  const a1 = du(u);
  const b1 = dv(v);
  const a2 = du(v);
  const b2 = dv(u);
  if (a1 !== undefined && b1 !== undefined && a1 + 1 + b1 === dTotal) {
    return true;
  }
  if (a2 !== undefined && b2 !== undefined && a2 + 1 + b2 === dTotal) {
    return true;
  }
  return false;
}

function findBatteryPartId(scene: Scene): PartId | null {
  const b = scene.parts.find((p) => p.kind === 'battery');
  return b ? partId(b.id) : null;
}

function internalEdgeForPart(
  p: Scene['parts'][number],
  edges: readonly GraphEdge[],
): GraphEdge | undefined {
  const suffixes =
    p.kind === 'battery' ? ['cell'] : ['body', 'contact'];
  const ids = suffixes.map((s) => `int:${p.id}:${s}`);
  return edges.find((e) => e.kind === 'internal' && ids.includes(e.id));
}

function buildPartHints(
  scene: Scene,
  loop: boolean,
  edges: readonly GraphEdge[],
  distP: Map<PinId, number>,
  distN: Map<PinId, number>,
  dTotal: number,
): Map<PartId, PartSimHint> {
  const m = new Map<PartId, PartSimHint>();
  for (const p of scene.parts) {
    const pid = partId(p.id);
    if (p.kind === 'battery') {
      m.set(pid, { batterySupplying: loop, loadEnergized: false });
      continue;
    }
    let load = false;
    if (loop) {
      const internal = internalEdgeForPart(p, edges);
      if (
        internal &&
        edgeOnShortestPath(internal, distP, distN, dTotal)
      ) {
        load = true;
      }
    }
    m.set(pid, { batterySupplying: false, loadEnergized: load });
  }
  return m;
}

function emptyHints(scene: Scene): Map<PartId, PartSimHint> {
  const m = new Map<PartId, PartSimHint>();
  for (const p of scene.parts) {
    m.set(partId(p.id), {
      batterySupplying: false,
      loadEnergized: false,
    });
  }
  return m;
}

/**
 * Phase A: connectivity from battery + to −; energize wires on shortest paths.
 */
export function simulate(scene: Scene, options: SimulateOptions): SimResult {
  if (!options.testActive) {
    return {
      testActive: false,
      isCompleteLoop: false,
      energizedWireIds: new Set(),
      partHints: emptyHints(scene),
      statusMessage: 'Test is off. Turn on Test to check the circuit.',
    };
  }

  const batteryPartId = findBatteryPartId(scene);
  if (batteryPartId === null) {
    return {
      testActive: true,
      isCompleteLoop: false,
      energizedWireIds: new Set(),
      partHints: emptyHints(scene),
      statusMessage: 'Add a battery to form a complete loop.',
    };
  }

  const pos = makePinId(batteryPartId, 'positive');
  const neg = makePinId(batteryPartId, 'negative');
  const graph = buildGraph(scene);
  const neighbors = neighborsFromEdges(graph.edges);
  const distP = bfsDist(pos, neighbors);
  const distN = bfsDist(neg, neighbors);

  if (!distP.has(neg)) {
    return {
      testActive: true,
      isCompleteLoop: false,
      energizedWireIds: new Set(),
      partHints: emptyHints(scene),
      statusMessage:
        'No complete path from battery positive to negative. Check wires and switches.',
    };
  }

  const dTotal = distP.get(neg)!;
  const energizedWires = new Set(
    graph.edges
      .filter(
        (e) =>
          e.kind === 'wire' &&
          e.wireId !== null &&
          edgeOnShortestPath(e, distP, distN, dTotal),
      )
      .map((e) => e.wireId!),
  );

  const hints = buildPartHints(
    scene,
    true,
    graph.edges,
    distP,
    distN,
    dTotal,
  );

  return {
    testActive: true,
    isCompleteLoop: true,
    energizedWireIds: energizedWires,
    partHints: hints,
    statusMessage:
      'Complete loop: conventional current flows from positive to negative.',
  };
}
