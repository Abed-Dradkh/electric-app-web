import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import type { SupplyKind } from '../../model/supplyKind';
import type { ComponentKind } from '../../model/types';
import { AddGlyph, PartKindGlyph } from './paletteIcons';
import { PALETTE_KINDS_AC, PALETTE_KINDS_DC } from './paletteItems';

export type PaletteProps = {
  readonly onAdd: (kind: ComponentKind) => void;
  readonly supplyKind: SupplyKind;
  readonly onSupplyKindChange: (kind: SupplyKind) => void;
};

function palettePartLabel(
  t: (key: string) => string,
  kind: ComponentKind,
  supplyKind: SupplyKind,
): string {
  if (kind === 'bulb' && supplyKind === 'ac') {
    return t('part.lamp');
  }
  return t(`part.${kind}`);
}

export function Palette({
  onAdd,
  supplyKind,
  onSupplyKindChange,
}: PaletteProps) {
  const { t } = useTranslation();
  const supplyGroupId = useId();
  const paletteKinds =
    supplyKind === 'ac' ? PALETTE_KINDS_AC : PALETTE_KINDS_DC;

  return (
    <aside className="palette" aria-label={t('palette.asideAria')}>
      <div className="palette-supply">
        <p className="palette-supply-label" id={supplyGroupId}>
          {t('palette.supply')}
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
            {t('palette.dc')}
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
            {t('palette.ac')}
          </button>
        </div>
        <p className="palette-supply-hint">
          {supplyKind === 'ac'
            ? t('palette.hintAcSupply')
            : t('palette.hintDcSupply')}
        </p>
      </div>
      <h2 className="palette-title">{t('palette.parts')}</h2>
      <p className="palette-hint">
        {supplyKind === 'ac'
          ? t('palette.hintAcParts')
          : t('palette.hintDcParts')}
      </p>
      <ul className="palette-list">
        {paletteKinds.map((kind) => {
          const label = palettePartLabel(t, kind, supplyKind);
          return (
            <li key={kind}>
              <button
                type="button"
                className="palette-btn"
                onClick={() => onAdd(kind)}
                aria-label={t('palette.addPart', { label })}
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
          );
        })}
      </ul>
    </aside>
  );
}
