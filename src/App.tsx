import { Navigate, Route, Routes } from 'react-router-dom';
import { StylesPage } from './pages/StylesPage';
import { WorkshopPage } from './pages/WorkshopPage';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<WorkshopPage />} />
      <Route path="/styles" element={<StylesPage />} />
      <Route
        path="/workshop-redesign/*"
        element={<Navigate to="/" replace />}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
