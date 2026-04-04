import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

export function StylesPage() {
  const { t } = useTranslation();
  return (
    <div className="app-root">
      <header className="app-header">
        <h1 className="app-title">{t('styles.title')}</h1>
        <div className="app-controls">
          <Link className="app-nav-link" to="/">
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
