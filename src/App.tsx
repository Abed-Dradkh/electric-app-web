import { Navigate, Route, Routes } from 'react-router-dom';
import { WorkshopPage } from './pages/WorkshopPage';
import { StylesPage } from './pages/StylesPage';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<WorkshopPage />} />
      <Route path="/styles" element={<StylesPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
