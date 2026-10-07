import { apiRequest } from '../../api/client';
import {
  webhookListSchema,
  webhookSchema,
  type WebhookUpdate,
} from './schema';

export interface WebhookListParams {
  page: number;
  search: string;
}

export const getWebhooks = ({ page, search }: WebhookListParams) => {
  const params = new URLSearchParams({ page: String(page), limit: '10' });
  if (search) params.set('search', search);
  return apiRequest(`/v1/webhooks?${params.toString()}`, {
    responseSchema: webhookListSchema,
  });
};

export const updateWebhook = (id: number, update: WebhookUpdate) =>
  apiRequest(`/v1/webhooks/${id}`, {
    method: 'PUT',
    body: update,
    responseSchema: webhookSchema,
  });
