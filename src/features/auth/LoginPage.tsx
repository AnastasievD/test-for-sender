import { useState } from 'react';
import {
  Anchor,
  Box,
  Button,
  Paper,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { isApiError } from '../../api/errors';
import { TEST_CREDENTIALS } from '../../mocks/database';
import { useAuth } from './AuthContext';

interface LocationState {
  from?: { pathname: string; search?: string };
}

export const LoginPage = () => {
  const { user, login } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const form = useForm({
    initialValues: {
      email: TEST_CREDENTIALS.email,
      password: TEST_CREDENTIALS.password,
    },
    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Enter a valid email'),
      password: (value) => (value ? null : 'Password is required'),
    },
  });

  if (user) return <Navigate to="/webhooks" replace />;

  const handleSubmit = form.onSubmit(async (values) => {
    setSubmitError(null);
    try {
      await login(values);
      const state = location.state as LocationState | null;
      const destination = state?.from
        ? `${state.from.pathname}${state.from.search ?? ''}`
        : '/webhooks';
      navigate(destination, { replace: true });
    } catch (error) {
      if (isApiError(error) && error.payload) {
        for (const [field, messages] of Object.entries(error.payload)) {
          form.setFieldError(field, messages[0] ?? 'Invalid value');
        }
      } else {
        setSubmitError(error instanceof Error ? error.message : 'Unable to sign in');
      }
    }
  });

  return (
    <main className="login-layout">
      <section className="login-brand" aria-label="Smart Sender introduction">
        <div className="brand-mark">SS</div>
        <div>
          <Text className="eyebrow">SMART SENDER</Text>
          <Title order={1}>Reliable delivery starts with visibility.</Title>
          <Text className="brand-copy">
            Review endpoints, verify their status and keep every integration current.
          </Text>
        </div>
        <Text className="brand-footnote">Webhook operations console</Text>
      </section>

      <Box className="login-panel">
        <Paper component="section" className="login-card" radius="lg">
          <Stack gap="xl">
            <div>
              <Text className="eyebrow" c="blue.7">WELCOME BACK</Text>
              <Title order={2}>Sign in to your workspace</Title>
              <Text c="dimmed" mt={8}>Use the test account to continue.</Text>
            </div>

            <form onSubmit={handleSubmit} noValidate>
              <Stack gap="md">
                <TextInput
                  label="Email"
                  placeholder="you@company.com"
                  autoComplete="email"
                  size="md"
                  {...form.getInputProps('email')}
                />
                <PasswordInput
                  label="Password"
                  autoComplete="current-password"
                  size="md"
                  {...form.getInputProps('password')}
                />
                {submitError && (
                  <Text c="red.7" size="sm" role="alert">{submitError}</Text>
                )}
                <Button type="submit" size="md" loading={form.submitting} fullWidth>
                  Sign in
                </Button>
              </Stack>
            </form>

            <Text size="sm" c="dimmed" ta="center">
              Test access is documented in the{' '}
              <Anchor href="https://github.com/AnastasievD/test-for-sender#readme">
                project README
              </Anchor>
            </Text>
          </Stack>
        </Paper>
      </Box>
    </main>
  );
};
