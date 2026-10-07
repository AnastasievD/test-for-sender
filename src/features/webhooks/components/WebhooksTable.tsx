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
import { useTranslation } from 'react-i18next';
import type { Webhook } from '../schema';

interface WebhooksTableProps {
  webhooks: Webhook[];
  loading: boolean;
  onEdit: (webhook: Webhook) => void;
}

const loadingRowIds = ['one', 'two', 'three', 'four', 'five', 'six'] as const;

const LoadingRows = () =>
  loadingRowIds.map((rowId, index) => (
    <Table.Tr key={rowId}>
      <Table.Td>
        <Skeleton height={18} width={`${55 + index * 4}%`} />
      </Table.Td>
      <Table.Td className="hidden sm:table-cell">
        <Skeleton height={18} width="82%" />
      </Table.Td>
      <Table.Td>
        <Skeleton height={24} width={68} radius="xl" />
      </Table.Td>
      <Table.Td>
        <Skeleton height={28} width={28} radius="md" />
      </Table.Td>
    </Table.Tr>
  ));

export const WebhooksTable = ({
  webhooks,
  loading,
  onEdit,
}: WebhooksTableProps) => {
  const { t } = useTranslation();

  if (!loading && webhooks.length === 0) {
    return (
      <Paper
        className="grid min-h-72 place-items-center border-slate-200 p-8"
        withBorder
        radius="lg"
      >
        <Stack align="center" gap="sm">
          <ThemeIcon variant="light" size={46} radius="xl">
            <IconWebhook size={24} />
          </ThemeIcon>
          <Title order={3}>{t('webhooks.empty.title')}</Title>
          <Text c="dimmed" ta="center">
            {t('webhooks.empty.description')}
          </Text>
        </Stack>
      </Paper>
    );
  }

  return (
    <Paper
      className="overflow-hidden border-slate-200 shadow-sm"
      withBorder
      radius="lg"
    >
      <Box className="overflow-x-auto">
        <Table verticalSpacing="md" horizontalSpacing="lg" highlightOnHover>
          <Table.Thead className="bg-slate-50 text-slate-500">
            <Table.Tr>
              <Table.Th className="text-xs font-bold tracking-wide uppercase">
                {t('webhooks.table.name')}
              </Table.Th>
              <Table.Th className="hidden text-xs font-bold tracking-wide uppercase sm:table-cell">
                {t('webhooks.table.endpointUrl')}
              </Table.Th>
              <Table.Th className="text-xs font-bold tracking-wide uppercase">
                {t('webhooks.table.status')}
              </Table.Th>
              <Table.Th
                className="text-xs font-bold tracking-wide uppercase"
                aria-label={t('a11y.tableActions')}
              />
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
                    <Text
                      className="mt-1 block max-w-64 font-mono sm:hidden"
                      c="dimmed"
                      size="sm"
                      truncate
                    >
                      {webhook.url}
                    </Text>
                  </Table.Td>
                  <Table.Td className="hidden sm:table-cell">
                    <Text ff="monospace" size="sm" c="dimmed">
                      {webhook.url}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge
                      variant="light"
                      color={webhook.active ? 'teal' : 'gray'}
                      radius="sm"
                    >
                      {webhook.active
                        ? t('webhooks.status.active')
                        : t('webhooks.status.inactive')}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Tooltip
                      label={t('actions.editWebhook', { name: webhook.name })}
                    >
                      <ActionIcon
                        variant="subtle"
                        color="gray"
                        aria-label={t('actions.editWebhook', {
                          name: webhook.name,
                        })}
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
