import type { ComponentKind } from '../../model/types';

const iconProps = {
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

/** Plus / add affordance. */
export function AddGlyph() {
  return (
    <svg {...iconProps} aria-hidden>
      <circle cx={12} cy={12} r={9} opacity={0.35} />
      <path d="M12 8v8M8 12h8" />
    </svg>
  );
}

function BatteryGlyph() {
  return (
    <svg {...iconProps} aria-hidden>
      <rect x={4} y={8} width={12} height={8} rx={1} />
      <path d="M16 10h2v4h-2" />
      <path d="M7 11h2M11 11h2" opacity={0.6} />
    </svg>
  );
}

function BulbGlyph() {
  return (
    <svg {...iconProps} aria-hidden>
      <path d="M9 18h6M10 20h4" />
      <path d="M12 3a5 5 0 0 0-3 9c.5.7 1 1.2 1 3h4c0-1.8.5-2.3 1-3a5 5 0 0 0-3-9z" />
    </svg>
  );
}

function ResistorGlyph() {
  return (
    <svg {...iconProps} aria-hidden>
      <path d="M4 12h3l1.5-3L11 15l2.5-6L16 12h4" />
    </svg>
  );
}

function LedGlyph() {
  return (
    <svg {...iconProps} aria-hidden>
      <path d="M4 12h8l4-4v8l-4-4H4" />
      <path d="M14 8l4-2M14 16l4 2" opacity={0.85} />
    </svg>
  );
}

function SwitchGlyph() {
  return (
    <svg {...iconProps} aria-hidden>
      <path d="M4 12h6" />
      <path d="M14 12h6" />
      <path d="M10 12l2-4" />
      <circle cx={10} cy={12} r={1.25} fill="currentColor" stroke="none" />
      <circle cx={14} cy={12} r={1.25} fill="currentColor" stroke="none" />
    </svg>
  );
}

export function PartKindGlyph({ kind }: { readonly kind: ComponentKind }) {
  switch (kind) {
    case 'battery':
      return <BatteryGlyph />;
    case 'bulb':
      return <BulbGlyph />;
    case 'resistor':
      return <ResistorGlyph />;
    case 'led':
      return <LedGlyph />;
    case 'switch':
      return <SwitchGlyph />;
  }
}
