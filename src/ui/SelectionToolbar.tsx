import { useTranslation } from 'react-i18next';

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

export type SelectionToolbarProps = {
  /** Board width in SVG units (center X = width / 2). */
  readonly boardWidth: number;
  readonly count: number;
  readonly onRemove: () => void;
};

export function SelectionToolbar({
  boardWidth,
  count,
  onRemove,
}: SelectionToolbarProps) {
  const { t } = useTranslation();
  const centerX = boardWidth / 2;
  /** Top padding inside the board below the rounded corner. */
  const topY = 22;

  return (
    <g
      transform={`translate(${centerX},${topY})`}
      className="selection-toolbar"
    >
      <foreignObject x={-200} y={0} width={400} height={56}>
        <div className="selection-toolbar-inner">
          <button
            type="button"
            className="part-action-btn part-action-btn--danger selection-toolbar-btn"
            aria-label={t('selection.removeCount', { count })}
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
          >
            <TrashIcon />
            <span>{t('selection.removeCount', { count })}</span>
          </button>
        </div>
      </foreignObject>
    </g>
  );
}
