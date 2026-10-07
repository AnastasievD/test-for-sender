import { lazy, Suspense } from 'react';
import { Center, Loader } from '@mantine/core';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthGuard } from '../features/auth/AuthGuard';

const LoginPage = lazy(() =>
  import('../features/auth/LoginPage').then((module) => ({
    default: module.LoginPage,
  })),
);

const WebhooksPage = lazy(() =>
  import('../features/webhooks/WebhooksPage').then((module) => ({
    default: module.WebhooksPage,
  })),
);

export const AppRouter = () => (
  <Suspense
    fallback={
      <Center mih="100vh">
        <Loader aria-label="Loading application" />
      </Center>
    }
  >
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<AuthGuard />}>
        <Route path="/webhooks" element={<WebhooksPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/webhooks" replace />} />
    </Routes>
  </Suspense>
);
