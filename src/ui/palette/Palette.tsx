import { useId } from 'react';
import type { SupplyKind } from '../../model/supplyKind';
import type { ComponentKind } from '../../model/types';
import { AddGlyph, PartKindGlyph } from './paletteIcons';
import { COPY } from '../../strings';
import { PALETTE_ITEMS_AC, PALETTE_ITEMS_DC } from './paletteItems';

export type PaletteProps = {
  readonly onAdd: (kind: ComponentKind) => void;
  readonly supplyKind: SupplyKind;
  readonly onSupplyKindChange: (kind: SupplyKind) => void;
};

export function Palette({
  onAdd,
  supplyKind,
  onSupplyKindChange,
}: PaletteProps) {
  const supplyGroupId = useId();
  const paletteItems =
    supplyKind === 'ac' ? PALETTE_ITEMS_AC : PALETTE_ITEMS_DC;

  return (
    <aside className="palette" aria-label="Parts palette">
      <div className="palette-supply">
        <p className="palette-supply-label" id={supplyGroupId}>
          Supply
        </p>
        <div
          className="palette-supply-row"
          role="group"
          aria-labelledby={supplyGroupId}
        >
          <button
            type="button"
            className={
              supplyKind === 'dc'
                ? 'palette-supply-btn palette-supply-btn--active'
                : 'palette-supply-btn'
            }
            aria-pressed={supplyKind === 'dc'}
            onClick={() => onSupplyKindChange('dc')}
          >
            DC
          </button>
          <button
            type="button"
            className={
              supplyKind === 'ac'
                ? 'palette-supply-btn palette-supply-btn--active'
                : 'palette-supply-btn'
            }
            aria-pressed={supplyKind === 'ac'}
            onClick={() => onSupplyKindChange('ac')}
          >
            AC
          </button>
        </div>
        <p className="palette-supply-hint">
          {supplyKind === 'ac' ? COPY.paletteAcSupplyHint : COPY.paletteDcSupplyHint}
        </p>
      </div>
      <h2 className="palette-title">Parts</h2>
      <p className="palette-hint">
        {supplyKind === 'ac' ? COPY.paletteAcPartsHint : COPY.paletteDcPartsHint}
      </p>
      <ul className="palette-list">
        {paletteItems.map(({ kind, label }) => (
          <li key={kind}>
            <button
              type="button"
              className="palette-btn"
              onClick={() => onAdd(kind)}
              aria-label={`Add ${label}`}
            >
              <span className="palette-btn-add" aria-hidden>
                <AddGlyph />
              </span>
              <span className="palette-btn-name">{label}</span>
              <span className="palette-btn-part" aria-hidden>
                <PartKindGlyph kind={kind} />
              </span>
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}
