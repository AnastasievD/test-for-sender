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
import { useAuth } from '../auth/AuthContext';
import { ErrorState } from '../../shared/ui/ErrorState';
import { getWebhooks } from './api';
import { WebhookEditModal } from './components/WebhookEditModal';
import { WebhooksTable } from './components/WebhooksTable';
import { useWebhookSearchParams } from './hooks/useWebhookSearchParams';
import type { Webhook } from './schema';

export const WebhooksPage = () => {
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
        <Container size="lg" className="flex min-h-16 items-center justify-between sm:min-h-[4.5rem]">
          <Group gap="sm">
            <div className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-800 text-white shadow-[0_0.45rem_1.1rem_rgba(28,126,214,0.22)]">
              <IconWebhook size={21} stroke={1.8} />
            </div>
            <Text fw={750} size="lg">Smart Sender</Text>
          </Group>
          <Group gap="sm">
            <Box className="hidden sm:block">
              <Text size="sm" fw={600} ta="right">{user?.name}</Text>
              <Text size="xs" c="dimmed">{user?.email}</Text>
            </Box>
            <Avatar color="blue" radius="xl">{initials}</Avatar>
            <Tooltip label="Sign out">
              <ActionIcon
                variant="subtle"
                color="gray"
                size="lg"
                aria-label="Sign out"
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
        className="pt-[clamp(2.3rem,5vw,4.3rem)] pb-16"
      >
        <Stack gap="xl">
          <Group justify="space-between" align="flex-end" className="max-sm:items-start">
            <div>
              <Text className="text-xs font-bold tracking-[0.16em]" c="blue.7">
                DELIVERY CONFIGURATION
              </Text>
              <Title order={1} className="mt-1 text-[clamp(2rem,4vw,3rem)] tracking-[-0.04em]">
                Webhooks
              </Title>
              <Text c="dimmed" mt={6}>
                Monitor and maintain the endpoints connected to your workspace.
              </Text>
            </div>
            <Button
              className="max-sm:hidden"
              variant="light"
              leftSection={<IconWebhook size={17} />}
              disabled
            >
              {webhooksQuery.data?.paging.results.total ?? '—'} endpoints
            </Button>
          </Group>

          <TextInput
            className="w-full max-w-[29rem]"
            size="md"
            value={searchInput}
            onChange={(event) => setSearchInput(event.currentTarget.value)}
            leftSection={<IconSearch size={18} />}
            placeholder="Search webhooks by name"
            aria-label="Search webhooks by name"
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
                  {webhooksQuery.data?.paging.results.total ?? 0} results
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
