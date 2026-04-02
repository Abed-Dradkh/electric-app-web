/** Workshop supply type (UI + future AC simulation). */
export type SupplyKind = 'dc' | 'ac';

export function isSupplyKind(v: string): v is SupplyKind {
  return v === 'dc' || v === 'ac';
}
