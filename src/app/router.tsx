import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthGuard } from '../features/auth/AuthGuard';
import { LoginPage } from '../features/auth/LoginPage';
import { WebhooksPage } from '../features/webhooks/WebhooksPage';

export const AppRouter = () => (
  <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route element={<AuthGuard />}>
      <Route path="/webhooks" element={<WebhooksPage />} />
    </Route>
    <Route path="*" element={<Navigate to="/webhooks" replace />} />
  </Routes>
);
