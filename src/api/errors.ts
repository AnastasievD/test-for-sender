import { z } from 'zod';
import { i18n } from '../i18n';

export const apiErrorTypeSchema = z.enum([
  'BadRequestException',
  'AuthenticationException',
  'NotFoundException',
  'TokenMismatchException',
  'ValidationException',
]);

const apiErrorBodySchema = z.object({
  error: z.object({
    type: apiErrorTypeSchema,
    message: z.string(),
    payload: z.record(z.string(), z.array(z.string())).optional(),
  }),
});

export type ApiErrorType = z.infer<typeof apiErrorTypeSchema>;

export class ApiError extends Error {
  readonly status: number;
  readonly type: string | undefined;
  readonly payload: Record<string, string[]> | undefined;

  constructor(status: number, body: unknown) {
    const parsed = apiErrorBodySchema.safeParse(body);
    const apiError = parsed.success ? parsed.data.error : undefined;
    super(apiError?.message ?? i18n.t('errors.requestFailed', { status }));
    this.name = 'ApiError';
    this.status = status;
    this.type = apiError?.type;
    this.payload = apiError?.payload;
  }
}

export const isApiError = (error: unknown): error is ApiError =>
  error instanceof ApiError;
