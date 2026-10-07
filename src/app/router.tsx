import { Button, Center, Stack, Text, Title } from '@mantine/core';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthGuard } from '../features/auth/AuthGuard';
import { LoginPage } from '../features/auth/LoginPage';
import { useAuth } from '../features/auth/AuthContext';

const WebhooksPlaceholder = () => {
  const { logout } = useAuth();
  return (
    <Center mih="100vh">
      <Stack align="center">
        <Title order={1}>Webhooks</Title>
        <Text c="dimmed">Your delivery endpoints are loading.</Text>
        <Button variant="subtle" onClick={() => void logout()}>Sign out</Button>
      </Stack>
    </Center>
  );
};

export const AppRouter = () => (
  <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route element={<AuthGuard />}>
      <Route path="/webhooks" element={<WebhooksPlaceholder />} />
    </Route>
    <Route path="*" element={<Navigate to="/webhooks" replace />} />
  </Routes>
);
