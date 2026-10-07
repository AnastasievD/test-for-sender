import { Button, Paper, Stack, Text, Title } from '@mantine/core';
import { IconAlertTriangle } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

interface ErrorStateProps {
  onRetry: () => void;
}

export const ErrorState = ({ onRetry }: ErrorStateProps) => {
  const { t } = useTranslation();

  return (
    <Paper className="grid min-h-72 place-items-center border-slate-200 p-8" withBorder radius="lg">
      <Stack align="center" gap="sm">
        <IconAlertTriangle size={30} stroke={1.7} color="var(--mantine-color-red-6)" />
        <Title order={3}>{t('webhooks.error.title')}</Title>
        <Text c="dimmed" ta="center">
          {t('webhooks.error.description')}
        </Text>
        <Button variant="light" onClick={onRetry}>{t('actions.retry')}</Button>
      </Stack>
    </Paper>
  );
};
