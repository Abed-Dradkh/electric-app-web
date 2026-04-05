import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { WorkshopBackIcon } from '../ui/workshopRedesignIcons';
import { loadStoredWorkshopLayoutVariant } from '../ui/workshopLayoutVariantStorage';

export function StylesPage() {
  const { t } = useTranslation();
  const [layoutVariant] = useState(
    () => loadStoredWorkshopLayoutVariant() ?? 'v1',
  );
  const rootClass =
    layoutVariant === 'v2'
      ? 'workshop-redesign workshop-redesign--v2'
      : 'workshop-redesign';

  return (
    <div className={rootClass}>
      <header className="workshop-redesign-header">
        <h1 className="workshop-redesign-title">{t('styles.title')}</h1>
        <div className="workshop-redesign-header-actions">
          <Link
            className="styles-page-back-link workshop-redesign-pill workshop-redesign-pill--gold"
            to="/"
          >
            <WorkshopBackIcon />
            {t('styles.back')}
          </Link>
        </div>
      </header>
      <main className="styles-page-main">
        <p className="styles-page-lead">{t('styles.description')}</p>
      </main>
    </div>
  );
}
