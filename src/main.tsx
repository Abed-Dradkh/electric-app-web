import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import './i18n';
import { App } from './App';
import { ThemeProvider } from './ui/ThemeProvider';
import './app.css';

const el = document.getElementById('root');
if (!el) {
  throw new Error('Root element not found');
}

createRoot(el).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <App />
      </ThemeProvider>
      <Analytics />
      <SpeedInsights />
    </BrowserRouter>
  </StrictMode>,
);
