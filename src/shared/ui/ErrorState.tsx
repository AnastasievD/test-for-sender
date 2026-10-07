import { Button, Paper, Stack, Text, Title } from '@mantine/core';
import { IconAlertTriangle } from '@tabler/icons-react';

interface ErrorStateProps {
  onRetry: () => void;
}

export const ErrorState = ({ onRetry }: ErrorStateProps) => (
  <Paper className="state-card" withBorder radius="lg">
    <Stack align="center" gap="sm">
      <IconAlertTriangle size={30} stroke={1.7} color="var(--mantine-color-red-6)" />
      <Title order={3}>Webhooks could not be loaded</Title>
      <Text c="dimmed" ta="center">
        Check the connection and try the request again.
      </Text>
      <Button variant="light" onClick={onRetry}>Try again</Button>
    </Stack>
  </Paper>
);
