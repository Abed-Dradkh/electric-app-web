/** Stable string id for a pin (e.g. part id + role). */
export type PinId = string & { readonly __brand: 'PinId' };

/** Identifier for a placed component. */
export type PartId = string & { readonly __brand: 'PartId' };

/** Identifier for a wire between two pins. */
export type WireId = string & { readonly __brand: 'WireId' };

export function pinId(value: string): PinId {
  return value as PinId;
}

export function partId(value: string): PartId {
  return value as PartId;
}

export function wireId(value: string): WireId {
  return value as WireId;
}
