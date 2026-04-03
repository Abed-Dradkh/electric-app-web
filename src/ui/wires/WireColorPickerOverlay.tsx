import { useTranslation } from 'react-i18next';
import type { WireKind } from '../../model/types';

export type WireColorPickerOverlayProps = {
  /** Board-space anchor (pin center). */
  readonly anchorX: number;
  readonly anchorY: number;
  readonly onPick: (kind: WireKind) => void;
};

const KINDS: readonly WireKind[] = ['live', 'neutral', 'switched'];

/**
 * Small popover above a pin to choose wire type (black / blue / red) before
 * starting a wire.
 */
export function WireColorPickerOverlay({
  anchorX,
  anchorY,
  onPick,
}: WireColorPickerOverlayProps) {
  const { t } = useTranslation();
  const w = 132;
  const h = 44;
  const x = anchorX - w / 2;
  const y = anchorY - 52;

  return (
    <g
      className="wire-color-picker"
      transform={`translate(${x},${y})`}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <foreignObject width={w} height={h} x={0} y={0}>
        <div
          className="wire-color-picker-inner"
          role="group"
          aria-label={t('wire.colorPickerGroup')}
        >
          {KINDS.map((kind) => (
            <button
              key={kind}
              type="button"
              className={`wire-color-swatch wire-color-swatch--${kind}`}
              aria-label={t(`wire.kind.${kind}`)}
              onClick={() => onPick(kind)}
            />
          ))}
        </div>
      </foreignObject>
    </g>
  );
}
