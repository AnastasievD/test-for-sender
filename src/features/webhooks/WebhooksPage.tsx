import { useEffect, useState } from 'react';
import {
  ActionIcon,
  Avatar,
  Box,
  Button,
  Container,
  Group,
  Pagination,
  Stack,
  Text,
  TextInput,
  Title,
  Tooltip,
} from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { IconLogout, IconSearch, IconWebhook } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../auth/AuthContext';
import { ErrorState } from '../../shared/ui/ErrorState';
import { getWebhooks } from './api';
import { WebhookEditModal } from './components/WebhookEditModal';
import { WebhooksTable } from './components/WebhooksTable';
import { useWebhookSearchParams } from './hooks/useWebhookSearchParams';
import type { Webhook } from './schema';

export const WebhooksPage = () => {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { page, search, setPage, setSearch } = useWebhookSearchParams();
  const [searchInput, setSearchInput] = useState(search);
  const [selectedWebhook, setSelectedWebhook] = useState<Webhook | null>(null);
  const [debouncedSearch] = useDebouncedValue(searchInput, 300);

  useEffect(() => {
    if (debouncedSearch.trim() !== search) setSearch(debouncedSearch);
  }, [debouncedSearch, search, setSearch]);

  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  const webhooksQuery = useQuery({
    queryKey: ['webhooks', { page, search }],
    queryFn: () => getWebhooks({ page, search }),
    placeholderData: keepPreviousData,
  });

  const initials = user
    ? `${user.first_name[0] ?? ''}${user.last_name[0] ?? ''}`
    : '';

  return (
    <Box className="app-surface min-h-screen">
      <header className="sticky top-0 z-10 border-b border-slate-300/80 bg-white/90 backdrop-blur-xl">
        <Container size="lg" className="flex min-h-16 items-center justify-between">
          <Group gap="sm">
            <div className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-800 text-white shadow-lg">
              <IconWebhook size={21} stroke={1.8} />
            </div>
            <Text fw={700} size="lg">{t('common.appName')}</Text>
          </Group>
          <Group gap="sm">
            <Box className="hidden sm:block">
              <Text size="sm" fw={600} ta="right">{user?.name}</Text>
              <Text size="xs" c="dimmed">{user?.email}</Text>
            </Box>
            <Avatar color="blue" radius="xl">{initials}</Avatar>
            <Tooltip label={t('actions.signOut')}>
              <ActionIcon
                variant="subtle"
                color="gray"
                size="lg"
                aria-label={t('actions.signOut')}
                onClick={() => void logout()}
              >
                <IconLogout size={19} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Container>
      </header>

      <Container
        component="main"
        size="lg"
        className="pt-10 pb-16 sm:pt-14 lg:pt-16"
      >
        <Stack gap="xl">
          <Group justify="space-between" align="flex-end" className="max-sm:items-start">
            <div>
              <Text className="text-xs font-bold tracking-widest" c="blue.7">
                {t('webhooks.eyebrow')}
              </Text>
              <Title order={1} className="mt-1 text-4xl tracking-tight sm:text-5xl">
                {t('webhooks.title')}
              </Title>
              <Text c="dimmed" mt={6}>
                {t('webhooks.description')}
              </Text>
            </div>
            <Button
              className="max-sm:hidden"
              variant="light"
              leftSection={<IconWebhook size={17} />}
              disabled
            >
              {t('webhooks.endpointCount', {
                count: webhooksQuery.data?.paging.results.total ?? 0,
              })}
            </Button>
          </Group>

          <TextInput
            className="w-full max-w-md"
            size="md"
            value={searchInput}
            onChange={(event) => setSearchInput(event.currentTarget.value)}
            leftSection={<IconSearch size={18} />}
            placeholder={t('webhooks.searchPlaceholder')}
            aria-label={t('webhooks.searchPlaceholder')}
          />

          {webhooksQuery.isError ? (
            <ErrorState onRetry={() => void webhooksQuery.refetch()} />
          ) : (
            <WebhooksTable
              webhooks={webhooksQuery.data?.data ?? []}
              loading={webhooksQuery.isPending}
              onEdit={setSelectedWebhook}
            />
          )}

          {!webhooksQuery.isError &&
            (webhooksQuery.data?.paging.pages.last ?? 1) > 1 && (
              <Group justify="space-between" className="max-sm:justify-center">
                <Text className="max-sm:hidden" size="sm" c="dimmed">
                  {t('webhooks.resultCount', {
                    count: webhooksQuery.data?.paging.results.total ?? 0,
                  })}
                </Text>
                <Pagination
                  value={page}
                  total={webhooksQuery.data?.paging.pages.last ?? 1}
                  onChange={setPage}
                  withEdges
                />
              </Group>
            )}
        </Stack>
      </Container>
      <WebhookEditModal
        webhook={selectedWebhook}
        onClose={() => setSelectedWebhook(null)}
      />
    </Box>
  );
};
