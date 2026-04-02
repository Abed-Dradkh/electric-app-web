import type { ComponentKind } from '../../model/types';
import { AddGlyph, PartKindGlyph } from './paletteIcons';

const PALETTE_ITEMS: { kind: ComponentKind; label: string }[] = [
  { kind: 'battery', label: 'Battery' },
  { kind: 'bulb', label: 'Bulb' },
  { kind: 'resistor', label: 'Resistor' },
  { kind: 'led', label: 'LED' },
  { kind: 'switch', label: 'Switch' },
];

export type PaletteProps = {
  readonly onAdd: (kind: ComponentKind) => void;
};

export function Palette({ onAdd }: PaletteProps) {
  return (
    <aside className="palette" aria-label="Parts palette">
      <h2 className="palette-title">Parts</h2>
      <p className="palette-hint">
        Use the controls below, then click two pins to run a wire. Double-click a
        switch body to open or close it.
      </p>
      <ul className="palette-list">
        {PALETTE_ITEMS.map(({ kind, label }) => (
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
