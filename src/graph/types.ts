import type { PinId, WireId } from '../model/ids';

/** One conducting edge in the lumped graph. */
export type GraphEdge = {
  readonly id: string;
  readonly a: PinId;
  readonly b: PinId;
  readonly kind: 'wire' | 'internal';
  /** Present when `kind === 'wire'`. */
  readonly wireId: WireId | null;
};

export type CircuitGraph = {
  readonly edges: readonly GraphEdge[];
};
