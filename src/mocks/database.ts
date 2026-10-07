import type { Webhook, WebhookList, WebhookUpdate } from '../features/webhooks/types';
import { TEST_CREDENTIALS } from '../shared/config/constants';

export const mockUser = {
  id: 1,
  email: TEST_CREDENTIALS.email,
  first_name: 'Dima',
  last_name: 'Anastasiev',
  name: 'Dima Anastasiev',
} as const;

const webhookNames = [
  'Customer created',
  'Customer updated',
  'Order completed',
  'Order refunded',
  'Payment received',
  'Payment failed',
  'Subscription started',
  'Subscription renewed',
  'Subscription cancelled',
  'Campaign launched',
  'Campaign paused',
  'Email delivered',
  'Email opened',
  'Email bounced',
  'Message queued',
  'Message sent',
  'Message read',
  'Contact imported',
  'Contact unsubscribed',
  'Tag assigned',
  'Tag removed',
  'Automation started',
  'Automation completed',
  'Invoice created',
  'Invoice paid',
  'Lead qualified',
  'Lead converted',
  'Workspace updated',
] as const;

const createWebhooks = (): Webhook[] =>
  webhookNames.map((name, index) => ({
    id: index + 1,
    name,
    url: `https://api.example.com/hooks/${index + 1}`,
    active: index % 4 !== 3,
    created_at: new Date(Date.UTC(2026, 0, index + 1)).toISOString(),
  }));

let webhooks = createWebhooks();

export const resetDatabase = () => {
  webhooks = createWebhooks();
};

export const listWebhooks = (
  page: number,
  limit: number,
  search: string,
): WebhookList => {
  const normalizedSearch = search.trim().toLocaleLowerCase();
  const filtered = normalizedSearch
    ? webhooks.filter((webhook) =>
        webhook.name.toLocaleLowerCase().includes(normalizedSearch),
      )
    : webhooks;
  const lastPage = Math.max(1, Math.ceil(filtered.length / limit));
  const safePage = Math.min(page, lastPage);
  const start = (safePage - 1) * limit;

  return {
    data: filtered.slice(start, start + limit),
    paging: {
      pages: { current: safePage, last: lastPage },
      results: { total: filtered.length, limitation: limit },
    },
  };
};

export const findWebhook = (id: number) =>
  webhooks.find((webhook) => webhook.id === id);

export const updateWebhook = (id: number, update: WebhookUpdate) => {
  const index = webhooks.findIndex((webhook) => webhook.id === id);
  const current = webhooks[index];

  if (index === -1 || !current) return undefined;

  const updated = { ...current, ...update };
  webhooks[index] = updated;
  return updated;
};
