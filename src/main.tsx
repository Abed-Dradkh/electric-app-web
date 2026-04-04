import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import './i18n';
import { App } from './App';
import './app.css';

const el = document.getElementById('root');
if (!el) {
  throw new Error('Root element not found');
}

createRoot(el).render(
  <StrictMode>
    <App />
    <Analytics />
    <SpeedInsights />
  </StrictMode>,
);
