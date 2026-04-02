import type { MouseEvent, PointerEvent } from 'react';
import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import type { PinId } from '../../model/ids';
import {
  PIN_ROLES,
  makePinId,
  pinOffset,
  type PinRole,
} from '../../model/pinLayout';
import type { Part } from '../../model/types';
import type { PartSimHint } from '../../sim/types';
import {
  PART_ROTATE_HANDLE_BOX,
  partHoverBarBox,
  type PartHoverBarPosition,
  type RotateHandlePosition,
} from '../partHoverLayout';

export type PartViewProps = {
  readonly part: Part;
  readonly selected: boolean;
  readonly hint: PartSimHint | undefined;
  readonly testActive: boolean;
  readonly draftPin: PinId | null;
  readonly hoverBarPosition: PartHoverBarPosition;
  readonly rotateHandlePosition: RotateHandlePosition;
  readonly onPinClick: (pin: PinId) => void;
  readonly onBodyPointerDown: (e: PointerEvent<SVGRectElement>) => void;
  readonly onRemove: () => void;
  readonly onToggleSwitch?: () => void;
  readonly onToggleBreaker?: () => void;
  readonly onRotatePointerDown: (e: PointerEvent<HTMLButtonElement>) => void;
};

function stopPartDrag(
  e: PointerEvent<HTMLButtonElement> | MouseEvent<HTMLButtonElement>,
) {
  e.stopPropagation();
}

export function PartView({
  part,
  selected,
  hint,
  testActive,
  draftPin,
  hoverBarPosition,
  rotateHandlePosition,
  onPinClick,
  onBodyPointerDown,
  onRemove,
  onToggleSwitch,
  onToggleBreaker,
  onRotatePointerDown,
}: PartViewProps) {
  const { t } = useTranslation();
  const bar = partHoverBarBox(part.kind, hoverBarPosition);
  const rotateBox = PART_ROTATE_HANDLE_BOX[rotateHandlePosition];
  const placementClass = `part-actions-inner--${hoverBarPosition}`;
  const roles = PIN_ROLES[part.kind];
  const label = partLabel(t, part);
  const isSupply =
    part.kind === 'battery' || part.kind === 'ac_supply';
  const loadOn =
    testActive && hint?.loadEnergized && !isSupply;
  const batOn =
    testActive &&
    hint?.batterySupplying &&
    (part.kind === 'battery' || part.kind === 'ac_supply');
  const testIdle = testActive && !loadOn && !batOn;

  const partClasses = [
    'part',
    'part-with-actions',
    selected && 'part--selected',
    loadOn && 'part--load-on',
    batOn && 'part--battery-on',
    testIdle && 'part--test-idle',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <g transform={`translate(${part.x},${part.y}) rotate(${part.rotationDeg})`}>
      <g className={partClasses}>
        <rect
          className="part-body"
          x={-56}
          y={-36}
          width={112}
          height={72}
          rx={8}
          onPointerDown={(e) => {
            e.stopPropagation();
            onBodyPointerDown(e);
          }}
        />
        <text className="part-label" x={0} y={6} textAnchor="middle">
          {label}
        </text>
        {part.kind === 'switch' ? (
          <text className="part-switch-state" x={0} y={22} textAnchor="middle">
            {part.switchClosed ? t('common.on') : t('common.off')}
          </text>
        ) : null}
        {part.kind === 'breaker_2p' ? (
          <text className="part-switch-state" x={0} y={22} textAnchor="middle">
            {part.breakerOn ? t('common.on') : t('common.off')}
          </text>
        ) : null}
        <foreignObject
          x={bar.x}
          y={bar.y}
          width={bar.width}
          height={bar.height}
        >
          <div className={`part-actions-inner ${placementClass}`}>
            <div className="part-actions-row">
              {part.kind === 'switch' && onToggleSwitch ? (
                <button
                  type="button"
                  className={[
                    'part-action-btn',
                    'part-action-btn--switch',
                    part.switchClosed
                      ? 'part-action-btn--switch-on'
                      : 'part-action-btn--switch-off',
                  ].join(' ')}
                  onPointerDown={stopPartDrag}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleSwitch();
                  }}
                  aria-pressed={part.switchClosed}
                  aria-label={
                    part.switchClosed
                      ? t('partView.switchOnAria')
                      : t('partView.switchOffAria')
                  }
                >
                  {part.switchClosed ? t('common.on') : t('common.off')}
                </button>
              ) : null}
              {part.kind === 'breaker_2p' && onToggleBreaker ? (
                <button
                  type="button"
                  className={[
                    'part-action-btn',
                    'part-action-btn--switch',
                    part.breakerOn
                      ? 'part-action-btn--switch-on'
                      : 'part-action-btn--switch-off',
                  ].join(' ')}
                  onPointerDown={stopPartDrag}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleBreaker();
                  }}
                  aria-pressed={part.breakerOn}
                  aria-label={
                    part.breakerOn
                      ? t('partView.breakerOnAria')
                      : t('partView.breakerOffAria')
                  }
                >
                  {part.breakerOn ? t('common.on') : t('common.off')}
                </button>
              ) : null}
              <button
                type="button"
                className="part-action-btn part-action-btn--danger"
                onPointerDown={stopPartDrag}
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove();
                }}
                aria-label={t('partView.remove', { label })}
              >
                <TrashIcon />
              </button>
            </div>
          </div>
        </foreignObject>
        <foreignObject
          x={rotateBox.x}
          y={rotateBox.y}
          width={rotateBox.width}
          height={rotateBox.height}
        >
          <div className="part-rotate-inner">
            <button
              type="button"
              className="part-rotate-btn"
              aria-label={t('partView.rotateAria')}
              onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onRotatePointerDown(e);
              }}
            >
              <RotateIcon />
            </button>
          </div>
        </foreignObject>
        {roles.map((role) => {
          const o = pinOffset(part, role);
          const id = makePinId(part.id, role);
          const selected = draftPin === id;
          return (
            <g key={role} transform={`translate(${o.x},${o.y})`}>
              <circle
                r={22}
                className={`pin-hit ${selected ? 'pin-hit--selected' : ''}`}
                tabIndex={0}
                role="button"
                aria-label={pinAria(t, part.kind, role)}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  onPinClick(id);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onPinClick(id);
                  }
                }}
              />
              <circle r={5} className="pin-dot" pointerEvents="none" />
            </g>
          );
        })}
      </g>
    </g>
  );
}

function RotateIcon() {
  return (
    <svg
      className="part-rotate-icon"
      width={22}
      height={22}
      viewBox="0 0 24 24"
      aria-hidden
    >
      <path
        fill="currentColor"
        d="M12 6V3L8 7l4 4V8c2.76 0 5 2.24 5 5 0 1.28-.48 2.47-1.29 3.36l1.42 1.42C18.36 16.52 19 14.82 19 13c0-3.87-3.13-7-7-7zm-1 13c-2.76 0-5-2.24-5-5 0-1.28.48-2.47 1.29-3.36L5.87 9.22C5.64 9.71 5.36 10.24 5.18 10.8 4.76 12 4.76 13.27 5.2 14.5 6.08 17.91 9.37 20 13 20c3.87 0 7-3.13 7-7h-2c0 2.76-2.24 5-5 5z"
      />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      className="part-action-icon"
      width={22}
      height={22}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6" />
    </svg>
  );
}

function partLabel(t: TFunction, part: Part): string {
  return t(`part.${part.kind}`);
}

function pinAria(t: TFunction, kind: Part['kind'], role: PinRole): string {
  if (kind === 'battery') {
    return role === 'positive' ? t('pin.positive') : t('pin.negative');
  }
  if (kind === 'ac_supply') {
    return role === 'l' ? t('pin.line') : t('pin.neutral');
  }
  if (kind === 'breaker_2p') {
    switch (role) {
      case 'l_in':
        return t('pin.lineIn');
      case 'n_in':
        return t('pin.neutralIn');
      case 'l_out':
        return t('pin.lineOut');
      case 'n_out':
        return t('pin.neutralOut');
      default:
        return t('pin.generic', { role: '?' });
    }
  }
  return t('pin.generic', { role: String(role).toUpperCase() });
}
