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
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { isApiError } from '../../api/errors';
import { TEST_CREDENTIALS } from '../../shared/config/constants';
import { useAuth } from './AuthContext';
import { loginInputSchema, type LoginInput } from './schema';

interface LocationState {
  from?: { pathname: string; search?: string };
}

export const LoginPage = () => {
  const { t } = useTranslation();
  const { user, login } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginInputSchema),
    defaultValues: {
      email: TEST_CREDENTIALS.email,
      password: TEST_CREDENTIALS.password,
    },
  });

  const state = location.state as LocationState | null;
  const destination = state?.from
    ? `${state.from.pathname}${state.from.search ?? ''}`
    : '/webhooks';

  if (user) return <Navigate to={destination} replace />;

  const onSubmit = handleSubmit(async (values) => {
    clearErrors('root');
    try {
      await login(values);
      navigate(destination, { replace: true });
    } catch (error) {
      if (isApiError(error) && error.payload) {
        for (const [field, messages] of Object.entries(error.payload)) {
          if (field === 'email' || field === 'password') {
            setError(field, {
              type: 'server',
              message: messages[0] ?? t('common.invalidValue'),
            });
          }
        }
      } else {
        setError('root.server', {
          type: 'server',
          message: error instanceof Error ? error.message : t('errors.signInFailed'),
        });
      }
    }
  });

  return (
    <main className="min-h-screen bg-slate-50 md:grid md:grid-cols-2">
      <section
        className="login-brand relative flex min-h-60 flex-col justify-between gap-10 overflow-hidden p-6 text-white md:min-h-screen md:p-12 xl:p-20"
        aria-label={t('login.introductionLabel')}
      >
        <div className="grid size-12 place-items-center rounded-xl border border-white/50 bg-white/10 text-sm font-bold tracking-wider backdrop-blur-xl">
          {t('login.mark')}
        </div>
        <div>
          <Text className="text-xs font-bold tracking-widest">
            {t('login.brandName')}
          </Text>
          <Title
            order={1}
            className="my-3 max-w-md text-4xl leading-tight tracking-tight text-white md:text-6xl xl:max-w-xl xl:text-7xl"
          >
            {t('login.headline')}
          </Title>
          <Text className="hidden max-w-xl text-lg leading-7 text-white/75 md:block">
            {t('login.description')}
          </Text>
        </div>
        <Text className="relative z-10 hidden text-sm text-white/60 md:block">
          {t('login.consoleName')}
        </Text>
      </section>

      <Box className="grid -translate-y-5 place-items-center p-4 md:translate-y-0 md:p-8">
        <Paper
          component="section"
          className="w-full max-w-md border border-slate-200 p-6 shadow-xl sm:p-10"
          radius="lg"
        >
          <Stack gap="xl">
            <div>
              <Text className="text-xs font-bold tracking-widest" c="blue.7">
                {t('login.eyebrow')}
              </Text>
              <Title order={2}>{t('login.title')}</Title>
              <Text c="dimmed" mt={8}>{t('login.subtitle')}</Text>
            </div>

            <form onSubmit={onSubmit} noValidate>
              <Stack gap="md">
                <TextInput
                  label={t('login.emailLabel')}
                  placeholder={t('login.emailPlaceholder')}
                  autoComplete="email"
                  size="md"
                  error={errors.email?.message}
                  {...register('email')}
                />
                <PasswordInput
                  label={t('login.passwordLabel')}
                  autoComplete="current-password"
                  size="md"
                  error={errors.password?.message}
                  {...register('password')}
                />
                {errors.root?.server?.message && (
                  <Text c="red.7" size="sm" role="alert">
                    {errors.root.server.message}
                  </Text>
                )}
                <Button type="submit" size="md" loading={isSubmitting} fullWidth>
                  {t('actions.signIn')}
                </Button>
              </Stack>
            </form>

            <Text size="sm" c="dimmed" ta="center">
              {t('login.readmePrefix')}{' '}
              <Anchor href="https://github.com/AnastasievD/test-for-sender#readme">
                {t('login.readmeLink')}
              </Anchor>
            </Text>
          </Stack>
        </Paper>
      </Box>
    </main>
  );
};
