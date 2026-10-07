import { z } from 'zod';
import { i18n } from '../../i18n';

const isHttpUrl = (value: string) => {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

export const webhookUpdateSchema = z.object({
  name: z.string().trim().min(1, i18n.t('validation.nameRequired')),
  url: z.string().trim().refine(isHttpUrl, i18n.t('validation.httpUrl')),
});

export const webhookSchema = webhookUpdateSchema.extend({
  id: z.number().int().positive(),
  active: z.boolean(),
  created_at: z.string().datetime(),
});

export const webhookListSchema = z.object({
  data: z.array(webhookSchema),
  paging: z.object({
    pages: z.object({
      current: z.number().int().positive(),
      last: z.number().int().positive(),
    }),
    results: z.object({
      total: z.number().int().nonnegative(),
      limitation: z.number().int().positive(),
    }),
  }),
});

export type WebhookUpdate = z.infer<typeof webhookUpdateSchema>;
export type Webhook = z.infer<typeof webhookSchema>;
export type WebhookList = z.infer<typeof webhookListSchema>;
