import { buildGraph } from '../graph/buildGraph';
import type { GraphEdge } from '../graph/types';
import i18n from '../i18n';
import type { PartId, PinId, WireId } from '../model/ids';
import { partId } from '../model/ids';
import { makePinId, PIN_ROLES } from '../model/pinLayout';
import type { SupplyKind } from '../model/supplyKind';
import type { Scene } from '../model/types';
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

/** BFS from the supply hot pin; collects wire ids and every reached pin. */
function bfsHotReach(
  start: PinId,
  neighbors: Map<PinId, { peer: PinId; edge: GraphEdge }[]>,
): { wireIds: Set<WireId>; reachablePins: Set<PinId> } {
  const reachablePins = new Set<PinId>();
  const wireIds = new Set<WireId>();
  const q: PinId[] = [start];
  reachablePins.add(start);
  while (q.length > 0) {
    const u = q.shift()!;
    for (const { peer, edge } of neighbors.get(u) ?? []) {
      if (edge.kind === 'wire' && edge.wireId !== null) {
        wireIds.add(edge.wireId);
      }
      if (!reachablePins.has(peer)) {
        reachablePins.add(peer);
        q.push(peer);
      }
    }
  }
  return { wireIds, reachablePins };
}

function partAnyPinReachable(
  p: Scene['parts'][number],
  reachablePins: Set<PinId>,
): boolean {
  for (const role of PIN_ROLES[p.kind]) {
    if (reachablePins.has(makePinId(p.id, role))) return true;
  }
  return false;
}

function edgeOnShortestPath(
  e: GraphEdge,
  distA: Map<PinId, number>,
  distB: Map<PinId, number>,
  dTotal: number,
): boolean {
  const du = (x: PinId) => distA.get(x);
  const dv = (x: PinId) => distB.get(x);
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

function findAcSupplyPartId(scene: Scene): PartId | null {
  const b = scene.parts.find((p) => p.kind === 'ac_supply');
  return b ? partId(b.id) : null;
}

function internalEdgeForPart(
  p: Scene['parts'][number],
  edges: readonly GraphEdge[],
): GraphEdge | undefined {
  switch (p.kind) {
    case 'battery':
    case 'ac_supply':
    case 'breaker_2p':
      return undefined;
    case 'bulb':
    case 'resistor':
    case 'led':
      return edges.find((e) => e.id === `int:${p.id}:body`);
    case 'switch':
      return edges.find((e) => e.id === `int:${p.id}:contact`);
  }
}

function buildPartHints(
  scene: Scene,
  loop: boolean,
  edges: readonly GraphEdge[],
  distA: Map<PinId, number>,
  distB: Map<PinId, number>,
  dTotal: number,
  reachablePins: Set<PinId>,
): Map<PartId, PartSimHint> {
  const m = new Map<PartId, PartSimHint>();
  for (const p of scene.parts) {
    const pid = partId(p.id);
    if (p.kind === 'battery' || p.kind === 'ac_supply') {
      m.set(pid, {
        batterySupplying: true,
        loadEnergized: false,
        supplyReachable: true,
      });
      continue;
    }
    if (p.kind === 'breaker_2p') {
      let load = false;
      if (loop && p.breakerOn) {
        const el = edges.find((e) => e.id === `int:${p.id}:l_conn`);
        const en = edges.find((e) => e.id === `int:${p.id}:n_conn`);
        if (
          el &&
          en &&
          edgeOnShortestPath(el, distA, distB, dTotal) &&
          edgeOnShortestPath(en, distA, distB, dTotal)
        ) {
          load = true;
        }
      }
      m.set(pid, {
        batterySupplying: false,
        loadEnergized: load,
        supplyReachable: partAnyPinReachable(p, reachablePins),
      });
      continue;
    }
    let load = false;
    if (loop) {
      const internal = internalEdgeForPart(p, edges);
      if (internal && edgeOnShortestPath(internal, distA, distB, dTotal)) {
        load = true;
      }
    }
    m.set(pid, {
      batterySupplying: false,
      loadEnergized: load,
      supplyReachable: partAnyPinReachable(p, reachablePins),
    });
  }
  return m;
}

function emptyHints(scene: Scene): Map<PartId, PartSimHint> {
  const m = new Map<PartId, PartSimHint>();
  for (const p of scene.parts) {
    m.set(partId(p.id), {
      batterySupplying: false,
      loadEnergized: false,
      supplyReachable: false,
    });
  }
  return m;
}

/** Hints from hot-side reachability only (incomplete loop / no return path). */
function buildHotHints(
  scene: Scene,
  reachablePins: Set<PinId>,
  supplyPartId: PartId,
): Map<PartId, PartSimHint> {
  const m = new Map<PartId, PartSimHint>();
  for (const p of scene.parts) {
    const pid = partId(p.id);
    const isSupply =
      pid === supplyPartId && (p.kind === 'battery' || p.kind === 'ac_supply');
    if (isSupply) {
      m.set(pid, {
        batterySupplying: true,
        loadEnergized: false,
        supplyReachable: true,
      });
    } else {
      m.set(pid, {
        batterySupplying: false,
        loadEnergized: false,
        supplyReachable: partAnyPinReachable(p, reachablePins),
      });
    }
  }
  return m;
}

function simulateDc(scene: Scene): SimResult {
  const batteryPartId = findBatteryPartId(scene);
  if (batteryPartId === null) {
    return {
      testActive: true,
      isCompleteLoop: false,
      energizedWireIds: new Set(),
      supplyReachWireIds: new Set(),
      partHints: emptyHints(scene),
      statusMessage: i18n.t('sim.dcAddBattery'),
    };
  }

  const graph = buildGraph(scene);
  const neighbors = neighborsFromEdges(graph.edges);
  const hotStart = makePinId(batteryPartId, 'positive');
  const { wireIds: supplyReachWireIds, reachablePins } = bfsHotReach(
    hotStart,
    neighbors,
  );

  const start = hotStart;
  const end = makePinId(batteryPartId, 'negative');
  const distA = bfsDist(start, neighbors);
  const distB = bfsDist(end, neighbors);

  if (!distA.has(end)) {
    return {
      testActive: true,
      isCompleteLoop: false,
      energizedWireIds: new Set(),
      supplyReachWireIds,
      partHints: buildHotHints(scene, reachablePins, batteryPartId),
      statusMessage: i18n.t('sim.dcNoPath'),
    };
  }

  const dTotal = distA.get(end)!;
  const energizedWires = new Set(
    graph.edges
      .filter(
        (e) =>
          e.kind === 'wire' &&
          e.wireId !== null &&
          edgeOnShortestPath(e, distA, distB, dTotal),
      )
      .map((e) => e.wireId!),
  );

  const hints = buildPartHints(
    scene,
    true,
    graph.edges,
    distA,
    distB,
    dTotal,
    reachablePins,
  );

  return {
    testActive: true,
    isCompleteLoop: true,
    energizedWireIds: energizedWires,
    supplyReachWireIds,
    partHints: hints,
    statusMessage: i18n.t('sim.dcComplete'),
  };
}

function simulateAc(scene: Scene): SimResult {
  const inletId = findAcSupplyPartId(scene);
  if (inletId === null) {
    return {
      testActive: true,
      isCompleteLoop: false,
      energizedWireIds: new Set(),
      supplyReachWireIds: new Set(),
      partHints: emptyHints(scene),
      statusMessage: i18n.t('sim.acAddInlet'),
    };
  }

  const graph = buildGraph(scene);
  const neighbors = neighborsFromEdges(graph.edges);
  /** AC “line” terminal — hot-side teaching convention. */
  const hotStart = makePinId(inletId, 'l');
  const { wireIds: supplyReachWireIds, reachablePins } = bfsHotReach(
    hotStart,
    neighbors,
  );

  const start = hotStart;
  const end = makePinId(inletId, 'n');
  const distA = bfsDist(start, neighbors);
  const distB = bfsDist(end, neighbors);

  if (!distA.has(end)) {
    return {
      testActive: true,
      isCompleteLoop: false,
      energizedWireIds: new Set(),
      supplyReachWireIds,
      partHints: buildHotHints(scene, reachablePins, inletId),
      statusMessage: i18n.t('sim.acNoPath'),
    };
  }

  const dTotal = distA.get(end)!;
  const energizedWires = new Set(
    graph.edges
      .filter(
        (e) =>
          e.kind === 'wire' &&
          e.wireId !== null &&
          edgeOnShortestPath(e, distA, distB, dTotal),
      )
      .map((e) => e.wireId!),
  );

  const hints = buildPartHints(
    scene,
    true,
    graph.edges,
    distA,
    distB,
    dTotal,
    reachablePins,
  );

  return {
    testActive: true,
    isCompleteLoop: true,
    energizedWireIds: energizedWires,
    supplyReachWireIds,
    partHints: hints,
    statusMessage: i18n.t('sim.acComplete'),
  };
}

/**
 * Phase A: DC — battery + to −; AC — AC inlet L to N. Energize wires on shortest paths.
 */
export function simulate(scene: Scene, options: SimulateOptions): SimResult {
  const supplyKind: SupplyKind = options.supplyKind ?? 'dc';

  if (!options.testActive) {
    return {
      testActive: false,
      isCompleteLoop: false,
      energizedWireIds: new Set(),
      supplyReachWireIds: new Set(),
      partHints: emptyHints(scene),
      statusMessage: i18n.t('sim.testOff'),
    };
  }

  if (supplyKind === 'ac') {
    return simulateAc(scene);
  }
  return simulateDc(scene);
}
