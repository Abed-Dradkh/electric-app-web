import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import type { SupplyKind } from '../../model/supplyKind';
import type { ComponentKind } from '../../model/types';
import { AddGlyph, PartKindGlyph } from './paletteIcons';
import { PALETTE_KINDS_AC, PALETTE_KINDS_DC } from './paletteItems';

export type PaletteAppearance = 'classic' | 'redesign';

export type PaletteProps = {
  readonly onAdd: (kind: ComponentKind) => void;
  readonly supplyKind: SupplyKind;
  readonly onSupplyKindChange: (kind: SupplyKind) => void;
  /** `redesign` matches the workshop sidebar cards (default). */
  readonly appearance?: PaletteAppearance;
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
  appearance = 'classic',
}: PaletteProps) {
  const { t } = useTranslation();
  const supplyGroupId = useId();
  const paletteKinds =
    supplyKind === 'ac' ? PALETTE_KINDS_AC : PALETTE_KINDS_DC;

  if (appearance === 'redesign') {
    return (
      <aside
        className="workshop-redesign-sidebar"
        aria-label={t('palette.asideAria')}
      >
        <div className="workshop-redesign-card">
          <p
            id={supplyGroupId}
            className="workshop-redesign-card-label"
          >
            {t('palette.supply')}
          </p>
          <div
            className="workshop-redesign-supply-row"
            role="group"
            aria-labelledby={supplyGroupId}
          >
            <button
              type="button"
              className={
                supplyKind === 'dc'
                  ? 'workshop-redesign-seg workshop-redesign-seg--active'
                  : 'workshop-redesign-seg'
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
                  ? 'workshop-redesign-seg workshop-redesign-seg--active'
                  : 'workshop-redesign-seg'
              }
              aria-pressed={supplyKind === 'ac'}
              onClick={() => onSupplyKindChange('ac')}
            >
              {t('palette.ac')}
            </button>
          </div>
          <p className="workshop-redesign-hint">
            {supplyKind === 'ac'
              ? t('palette.hintAcSupply')
              : t('palette.hintDcSupply')}
          </p>
        </div>

        <div className="workshop-redesign-card workshop-redesign-card--parts">
          <h2 className="workshop-redesign-card-label workshop-redesign-parts-heading">
            {t('palette.parts')}
          </h2>
          <p className="workshop-redesign-palette-long-hint">
            {supplyKind === 'ac'
              ? t('palette.hintAcParts')
              : t('palette.hintDcParts')}
          </p>
          <ul className="workshop-redesign-part-list">
            {paletteKinds.map((kind) => {
              const label = palettePartLabel(t, kind, supplyKind);
              return (
                <li key={kind}>
                  <button
                    type="button"
                    className="workshop-redesign-part-row"
                    onClick={() => onAdd(kind)}
                    aria-label={t('palette.addPart', { label })}
                  >
                    <span className="workshop-redesign-part-glyph" aria-hidden>
                      <PartKindGlyph kind={kind} />
                    </span>
                    <span className="workshop-redesign-part-name">{label}</span>
                    <span className="workshop-redesign-part-add" aria-hidden>
                      <AddGlyph />
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </aside>
    );
  }

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
