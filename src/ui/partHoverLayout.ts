/** Where the Remove / On/Off strip sits (part-local frame). */
export type PartHoverBarPosition = 'up' | 'down';

/** Where the rotate handle sits (part-local frame). */
export type RotateHandlePosition = 'left' | 'right';

/** `foreignObject` geometry in part-local coordinates. */
export type HoverBarBox = {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
};

import type { ComponentKind } from '../model/types';

/** Gap between the part body and controls (SVG units). */
export const PART_ACTION_BAR_GAP = 10;

/**
 * Bulb pins are vertical (top/bottom); the hover strip sits closer to them than
 * side pins on e.g. battery. Nudge the strip along the bar axis for bulbs only.
 */
export const PART_HOVER_BAR_BULB_EXTRA_GAP = 20;

/** Icon action buttons match rotate handle size (see `.part-action-btn`). */
const PART_ACTION_BTN_PX = 44;

export const ROTATE_HANDLE_PX = 44;

/** Hover bar: two icon buttons (toggle + remove) or one centered remove. */
const HOVER_BAR_WIDTH = PART_ACTION_BTN_PX + 8 + PART_ACTION_BTN_PX;
const HOVER_BAR_HEIGHT = PART_ACTION_BTN_PX;

/**
 * Remove / switch strip above or below the body.
 * Part rect in local space: −56…56, −36…36.
 */
export const PART_HOVER_BAR_BOX: Record<PartHoverBarPosition, HoverBarBox> = {
  up: {
    x: -HOVER_BAR_WIDTH / 2,
    y: -36 - PART_ACTION_BAR_GAP - HOVER_BAR_HEIGHT,
    width: HOVER_BAR_WIDTH,
    height: HOVER_BAR_HEIGHT,
  },
  down: {
    x: -HOVER_BAR_WIDTH / 2,
    y: 36 + PART_ACTION_BAR_GAP,
    width: HOVER_BAR_WIDTH,
    height: HOVER_BAR_HEIGHT,
  },
};

/** Hover bar `foreignObject` box; bulbs get extra offset away from vertical pins. */
export function partHoverBarBox(
  kind: ComponentKind,
  position: PartHoverBarPosition,
): HoverBarBox {
  const base = PART_HOVER_BAR_BOX[position];
  if (kind !== 'bulb' && kind !== 'breaker_2p') {
    return base;
  }
  const d = PART_HOVER_BAR_BULB_EXTRA_GAP;
  if (position === 'up') {
    return { ...base, y: base.y - d };
  }
  return { ...base, y: base.y + d };
}

/** Rotate handle beside the body (centered vertically on the 72px body). */
export const PART_ROTATE_HANDLE_BOX: Record<RotateHandlePosition, HoverBarBox> =
  {
    left: {
      x: -56 - PART_ACTION_BAR_GAP - ROTATE_HANDLE_PX,
      y: -22,
      width: ROTATE_HANDLE_PX,
      height: ROTATE_HANDLE_PX,
    },
    right: {
      x: 56 + PART_ACTION_BAR_GAP,
      y: -22,
      width: ROTATE_HANDLE_PX,
      height: ROTATE_HANDLE_PX,
    },
  };

const STORAGE_KEY_BAR = 'electric-app-part-hover-bar';
const STORAGE_KEY_ROTATE = 'electric-app-rotate-handle';

export function loadStoredHoverBarPosition(): PartHoverBarPosition | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY_BAR);
    if (v === 'up' || v === 'down') {
      return v;
    }
    if (
      v === 'left' ||
      v === 'right' ||
      v === 'higher' ||
      v === 'default' ||
      v === 'closer'
    ) {
      return 'up';
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function persistHoverBarPosition(position: PartHoverBarPosition): void {
  try {
    localStorage.setItem(STORAGE_KEY_BAR, position);
  } catch {
    /* ignore */
  }
}

export function loadStoredRotateHandlePosition(): RotateHandlePosition | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY_ROTATE);
    if (v === 'left' || v === 'right') {
      return v;
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function persistRotateHandlePosition(
  position: RotateHandlePosition,
): void {
  try {
    localStorage.setItem(STORAGE_KEY_ROTATE, position);
  } catch {
    /* ignore */
  }
}
