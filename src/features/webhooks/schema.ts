import { z } from 'zod';

const isHttpUrl = (value: string) => {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

export const webhookSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  url: z
    .string()
    .trim()
    .refine(isHttpUrl, 'Enter a valid HTTP/HTTPS URL'),
});

export type WebhookFormValues = z.infer<typeof webhookSchema>;
