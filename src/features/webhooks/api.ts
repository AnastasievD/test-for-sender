import { apiRequest } from '../../api/client';
import type { Webhook, WebhookList, WebhookUpdate } from './types';

export interface WebhookListParams {
  page: number;
  search: string;
}

export const getWebhooks = ({ page, search }: WebhookListParams) => {
  const params = new URLSearchParams({ page: String(page), limit: '10' });
  if (search) params.set('search', search);
  return apiRequest<WebhookList>(`/v1/webhooks?${params.toString()}`);
};

export const updateWebhook = (id: number, update: WebhookUpdate) =>
  apiRequest<Webhook>(`/v1/webhooks/${id}`, {
    method: 'PUT',
    body: update,
  });
