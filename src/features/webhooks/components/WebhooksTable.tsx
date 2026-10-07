import {
  ActionIcon,
  Badge,
  Box,
  Paper,
  Skeleton,
  Stack,
  Table,
  Text,
  ThemeIcon,
  Title,
  Tooltip,
} from '@mantine/core';
import { IconEdit, IconWebhook } from '@tabler/icons-react';
import type { Webhook } from '../types';

interface WebhooksTableProps {
  webhooks: Webhook[];
  loading: boolean;
  onEdit: (webhook: Webhook) => void;
}

const LoadingRows = () =>
  Array.from({ length: 6 }, (_, index) => (
    <Table.Tr key={index}>
      <Table.Td><Skeleton height={18} width={`${55 + index * 4}%`} /></Table.Td>
      <Table.Td className="url-column"><Skeleton height={18} width="82%" /></Table.Td>
      <Table.Td><Skeleton height={24} width={68} radius="xl" /></Table.Td>
      <Table.Td><Skeleton height={28} width={28} radius="md" /></Table.Td>
    </Table.Tr>
  ));

export const WebhooksTable = ({ webhooks, loading, onEdit }: WebhooksTableProps) => {
  if (!loading && webhooks.length === 0) {
    return (
      <Paper className="state-card" withBorder radius="lg">
        <Stack align="center" gap="sm">
          <ThemeIcon variant="light" size={46} radius="xl">
            <IconWebhook size={24} />
          </ThemeIcon>
          <Title order={3}>No matching webhooks</Title>
          <Text c="dimmed" ta="center">
            Try a different name or clear the current search.
          </Text>
        </Stack>
      </Paper>
    );
  }

  return (
    <Paper className="table-card" withBorder radius="lg">
      <Box className="table-scroll">
        <Table verticalSpacing="md" horizontalSpacing="lg" highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Name</Table.Th>
              <Table.Th className="url-column">Endpoint URL</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th aria-label="Actions" />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {loading ? (
              <LoadingRows />
            ) : (
              webhooks.map((webhook) => (
                <Table.Tr key={webhook.id}>
                  <Table.Td>
                    <Text fw={600}>{webhook.name}</Text>
                    <Text className="mobile-url" c="dimmed" size="sm" truncate>
                      {webhook.url}
                    </Text>
                  </Table.Td>
                  <Table.Td className="url-column">
                    <Text ff="monospace" size="sm" c="dimmed">{webhook.url}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge
                      variant="light"
                      color={webhook.active ? 'teal' : 'gray'}
                      radius="sm"
                    >
                      {webhook.active ? 'Active' : 'Inactive'}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Tooltip label={`Edit ${webhook.name}`}>
                      <ActionIcon
                        variant="subtle"
                        color="gray"
                        aria-label={`Edit ${webhook.name}`}
                        onClick={() => onEdit(webhook)}
                      >
                        <IconEdit size={17} />
                      </ActionIcon>
                    </Tooltip>
                  </Table.Td>
                </Table.Tr>
              ))
            )}
          </Table.Tbody>
        </Table>
      </Box>
    </Paper>
  );
};
