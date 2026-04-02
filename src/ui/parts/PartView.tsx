import type { MouseEvent, PointerEvent } from 'react';
import type { PinId } from '../../model/ids';
import { PIN_ROLES, makePinId, pinOffset } from '../../model/pinLayout';
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
  readonly hint: PartSimHint | undefined;
  readonly testActive: boolean;
  readonly draftPin: PinId | null;
  readonly hoverBarPosition: PartHoverBarPosition;
  readonly rotateHandlePosition: RotateHandlePosition;
  readonly onPinClick: (pin: PinId) => void;
  readonly onBodyPointerDown: (e: PointerEvent<SVGRectElement>) => void;
  readonly onRemove: () => void;
  readonly onToggleSwitch?: () => void;
  readonly onRotatePointerDown: (e: PointerEvent<HTMLButtonElement>) => void;
};

function stopPartDrag(
  e: PointerEvent<HTMLButtonElement> | MouseEvent<HTMLButtonElement>,
) {
  e.stopPropagation();
}

export function PartView({
  part,
  hint,
  testActive,
  draftPin,
  hoverBarPosition,
  rotateHandlePosition,
  onPinClick,
  onBodyPointerDown,
  onRemove,
  onToggleSwitch,
  onRotatePointerDown,
}: PartViewProps) {
  const bar = partHoverBarBox(part.kind, hoverBarPosition);
  const rotateBox = PART_ROTATE_HANDLE_BOX[rotateHandlePosition];
  const placementClass = `part-actions-inner--${hoverBarPosition}`;
  const roles = PIN_ROLES[part.kind];
  const label = labelForPart(part);
  const loadOn = testActive && hint?.loadEnergized && part.kind !== 'battery';
  const batOn = testActive && hint?.batterySupplying && part.kind === 'battery';
  const testIdle = testActive && !loadOn && !batOn;

  const partClasses = [
    'part',
    'part-with-actions',
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
          onDoubleClick={(e) => {
            e.stopPropagation();
            if (part.kind === 'switch' && onToggleSwitch) {
              onToggleSwitch();
            }
          }}
        />
        <text className="part-label" x={0} y={6} textAnchor="middle">
          {label}
        </text>
        {part.kind === 'switch' ? (
          <text className="part-switch-state" x={0} y={22} textAnchor="middle">
            {part.switchClosed ? 'Closed' : 'Open'}
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
                  className="part-action-btn"
                  onPointerDown={stopPartDrag}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleSwitch();
                  }}
                  aria-pressed={part.switchClosed}
                  aria-label={
                    part.switchClosed
                      ? 'Switch is closed. Click to open.'
                      : 'Switch is open. Click to close.'
                  }
                >
                  <SwitchToggleIcon closed={part.switchClosed} />
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
                aria-label={`Remove ${label}`}
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
              aria-label="Rotate part; drag while holding, release to set angle"
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
                aria-label={pinAria(part.kind, role)}
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

function SwitchToggleIcon({ closed }: { readonly closed: boolean }) {
  return (
    <svg
      className="part-action-icon"
      width={22}
      height={22}
      viewBox="0 0 24 24"
      aria-hidden
    >
      {closed ? (
        <>
          <rect
            x="2"
            y="7"
            width="20"
            height="10"
            rx="5"
            fill="currentColor"
            opacity="0.35"
          />
          <circle cx="15" cy="12" r="4" fill="currentColor" />
        </>
      ) : (
        <>
          <rect
            x="2"
            y="7"
            width="20"
            height="10"
            rx="5"
            fill="currentColor"
            opacity="0.2"
          />
          <circle cx="9" cy="12" r="4" fill="currentColor" />
        </>
      )}
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

function labelForPart(part: Part): string {
  switch (part.kind) {
    case 'battery':
      return 'Battery';
    case 'bulb':
      return 'Bulb';
    case 'resistor':
      return 'Resistor';
    case 'led':
      return 'LED';
    case 'switch':
      return 'Switch';
  }
}

function pinAria(
  kind: Part['kind'],
  role: 'positive' | 'negative' | 'a' | 'b',
): string {
  if (kind === 'battery') {
    return role === 'positive' ? 'Positive terminal' : 'Negative terminal';
  }
  return `Pin ${role.toUpperCase()}`;
}
