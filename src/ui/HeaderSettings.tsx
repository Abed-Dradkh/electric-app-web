import { useEffect, useId, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { PartHoverBarPosition, RotateHandlePosition } from './partHoverLayout';
import {
  persistHoverBarPosition,
  persistRotateHandlePosition,
} from './partHoverLayout';

function SettingsIcon() {
  return (
    <svg
      className="app-settings-icon"
      width={20}
      height={20}
      viewBox="0 0 24 24"
      aria-hidden
    >
      <path
        fill="currentColor"
        d="M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z"
      />
    </svg>
  );
}

export type HeaderSettingsProps = {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly hoverBarPosition: PartHoverBarPosition;
  readonly onHoverBarPositionChange: (value: PartHoverBarPosition) => void;
  readonly rotateHandlePosition: RotateHandlePosition;
  readonly onRotateHandlePositionChange: (value: RotateHandlePosition) => void;
<<<<<<< HEAD
=======
  readonly pinLabelsVisible: boolean;
  readonly onPinLabelsVisibleChange: (visible: boolean) => void;
>>>>>>> e1d5bf1 (updates)
};

export function HeaderSettings({
  open,
  onOpenChange,
  hoverBarPosition,
  onHoverBarPositionChange,
  rotateHandlePosition,
  onRotateHandlePositionChange,
<<<<<<< HEAD
=======
  pinLabelsVisible,
  onPinLabelsVisibleChange,
>>>>>>> e1d5bf1 (updates)
}: HeaderSettingsProps) {
  const { t, i18n } = useTranslation();
  const wrapRef = useRef<HTMLDivElement>(null);
  const labelLangId = useId();
  const labelBarId = useId();
  const labelRotateId = useId();
<<<<<<< HEAD
=======
  const labelPinLabelsId = useId();
>>>>>>> e1d5bf1 (updates)

  useEffect(() => {
    if (!open) return;
    function onDocPointerDown(e: PointerEvent) {
      const el = wrapRef.current;
      if (el && !el.contains(e.target as Node)) {
        onOpenChange(false);
      }
    }
    document.addEventListener('pointerdown', onDocPointerDown, true);
    return () =>
      document.removeEventListener('pointerdown', onDocPointerDown, true);
  }, [open, onOpenChange]);

  return (
    <div className="app-settings-wrap" ref={wrapRef}>
      <button
        type="button"
        className="btn btn--icon"
        aria-label={t('settings.open')}
        aria-expanded={open}
        aria-haspopup="true"
        aria-controls={open ? 'app-settings-panel' : undefined}
        onClick={() => onOpenChange(!open)}
      >
        <SettingsIcon />
      </button>
      {open ? (
        <div
          id="app-settings-panel"
          className="app-settings-dropdown"
          role="region"
          aria-label={t('settings.panelAria')}
        >
          <p id={labelLangId} className="app-settings-label">
            {t('settings.languageLabel')}
          </p>
          <div
            className="app-settings-segment"
            role="group"
            aria-labelledby={labelLangId}
            dir="ltr"
          >
            <button
              type="button"
              className={
                i18n.language === 'en'
                  ? 'app-settings-segment-btn app-settings-segment-btn--active'
                  : 'app-settings-segment-btn'
              }
              aria-pressed={i18n.language === 'en'}
              onClick={() => void i18n.changeLanguage('en')}
            >
              {t('lang.en')}
            </button>
            <button
              type="button"
              className={
                i18n.language === 'ar'
                  ? 'app-settings-segment-btn app-settings-segment-btn--active'
                  : 'app-settings-segment-btn'
              }
              aria-pressed={i18n.language === 'ar'}
              onClick={() => void i18n.changeLanguage('ar')}
            >
              {t('lang.ar')}
            </button>
          </div>
          <p id={labelBarId} className="app-settings-label app-settings-label--second">
            {t('settings.actionsLabel')}
          </p>
          <div
            className="app-settings-segment"
            role="group"
            aria-labelledby={labelBarId}
            dir="ltr"
          >
            <button
              type="button"
              className={
                hoverBarPosition === 'up'
                  ? 'app-settings-segment-btn app-settings-segment-btn--active'
                  : 'app-settings-segment-btn'
              }
              aria-pressed={hoverBarPosition === 'up'}
              onClick={() => {
                onHoverBarPositionChange('up');
                persistHoverBarPosition('up');
              }}
            >
              {t('settings.up')}
            </button>
            <button
              type="button"
              className={
                hoverBarPosition === 'down'
                  ? 'app-settings-segment-btn app-settings-segment-btn--active'
                  : 'app-settings-segment-btn'
              }
              aria-pressed={hoverBarPosition === 'down'}
              onClick={() => {
                onHoverBarPositionChange('down');
                persistHoverBarPosition('down');
              }}
            >
              {t('settings.down')}
            </button>
          </div>
          <p id={labelRotateId} className="app-settings-label app-settings-label--third">
            {t('settings.rotateLabel')}
          </p>
          <div
            className="app-settings-segment"
            role="group"
            aria-labelledby={labelRotateId}
            dir="ltr"
          >
            <button
              type="button"
              className={
                rotateHandlePosition === 'left'
                  ? 'app-settings-segment-btn app-settings-segment-btn--active'
                  : 'app-settings-segment-btn'
              }
              aria-pressed={rotateHandlePosition === 'left'}
              onClick={() => {
                onRotateHandlePositionChange('left');
                persistRotateHandlePosition('left');
              }}
            >
              {t('settings.left')}
            </button>
            <button
              type="button"
              className={
                rotateHandlePosition === 'right'
                  ? 'app-settings-segment-btn app-settings-segment-btn--active'
                  : 'app-settings-segment-btn'
              }
              aria-pressed={rotateHandlePosition === 'right'}
              onClick={() => {
                onRotateHandlePositionChange('right');
                persistRotateHandlePosition('right');
              }}
            >
              {t('settings.right')}
            </button>
          </div>
<<<<<<< HEAD
=======
          <p
            id={labelPinLabelsId}
            className="app-settings-label app-settings-label--fourth"
          >
            {t('settings.pinLabelsLabel')}
          </p>
          <div
            className="app-settings-segment"
            role="group"
            aria-labelledby={labelPinLabelsId}
            dir="ltr"
          >
            <button
              type="button"
              className={
                pinLabelsVisible
                  ? 'app-settings-segment-btn app-settings-segment-btn--active'
                  : 'app-settings-segment-btn'
              }
              aria-pressed={pinLabelsVisible}
              onClick={() => onPinLabelsVisibleChange(true)}
            >
              {t('settings.pinLabelsShow')}
            </button>
            <button
              type="button"
              className={
                !pinLabelsVisible
                  ? 'app-settings-segment-btn app-settings-segment-btn--active'
                  : 'app-settings-segment-btn'
              }
              aria-pressed={!pinLabelsVisible}
              onClick={() => onPinLabelsVisibleChange(false)}
            >
              {t('settings.pinLabelsHide')}
            </button>
          </div>
>>>>>>> e1d5bf1 (updates)
        </div>
      ) : null}
    </div>
  );
}
