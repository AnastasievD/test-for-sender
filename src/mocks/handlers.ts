import { delay, http, HttpResponse, type HttpResponseResolver } from 'msw';
import type { ApiErrorType } from '../api/errors';
import {
  issueSessionSchema,
  loginRequestSchema,
  sessionFingerprintSchema,
} from '../features/auth/schema';
import { webhookUpdateSchema } from '../features/webhooks/schema';
import {
  findWebhook,
  listWebhooks,
  mockUser,
  updateWebhook,
} from './database';
import { TEST_CREDENTIALS } from '../shared/config/constants';
import {
  CSRF_TOKEN,
  DEVICE_SESSION_TOKEN,
  hasActiveSession,
  issueSession,
  recordUnauthorized,
  revokeSession,
  rotateSession,
} from './session';

const apiError = (
  status: number,
  type: ApiErrorType,
  message: string,
  payload?: Record<string, string[]>,
) =>
  HttpResponse.json(
    { error: { type, message, ...(payload ? { payload } : {}) } },
    { status },
  );

const requestedWithError = (request: Request) =>
  request.headers.get('X-Requested-With') !== 'XMLHttpRequest'
    ? apiError(400, 'BadRequestException', 'Missing requested-with header.')
    : null;

const csrfError = (request: Request) =>
  request.headers.get('X-CSRF-TOKEN') !== CSRF_TOKEN
    ? apiError(419, 'TokenMismatchException', 'CSRF token mismatch.')
    : null;

const unauthorized = () => {
  recordUnauthorized();
  return apiError(401, 'AuthenticationException', 'Unauthenticated.');
};

const withSession = (resolver: HttpResponseResolver): HttpResponseResolver =>
  async (info) => {
    const headerError = requestedWithError(info.request);
    if (headerError) return headerError;
    if (!hasActiveSession()) return unauthorized();
    return resolver(info);
  };

const readJson = (request: Request): Promise<unknown> =>
  request.json().catch(() => null);

const fieldErrors = (issues: ReadonlyArray<{ path: PropertyKey[]; message: string }>) => {
  const payload: Record<string, string[]> = {};
  for (const issue of issues) {
    const field = issue.path[0];
    if (typeof field !== 'string') continue;
    (payload[field] ??= []).push(issue.message);
  }
  return payload;
};

export const handlers = [
  http.get('/csrf', ({ request }) => {
    const headerError = requestedWithError(request);
    if (headerError) return headerError;

    return new HttpResponse(null, {
      status: 204,
      headers: { 'X-CSRF-TOKEN': CSRF_TOKEN },
    });
  }),

  http.post('/auth/login', async ({ request }) => {
    const headerError = requestedWithError(request);
    if (headerError) return headerError;
    const tokenError = csrfError(request);
    if (tokenError) return tokenError;
    if (!request.headers.get('X-Captcha-Token')) {
      return apiError(400, 'BadRequestException', 'Captcha token is required.');
    }

    const parsed = loginRequestSchema.safeParse(await readJson(request));
    if (!parsed.success) {
      return apiError(
        422,
        'ValidationException',
        'The given data was invalid.',
        fieldErrors(parsed.error.issues),
      );
    }

    const payload: Record<string, string[]> = {};

    if (parsed.data.email !== TEST_CREDENTIALS.email) {
      payload.email = ['The selected email is invalid.'];
    }
    if (parsed.data.password !== TEST_CREDENTIALS.password) {
      payload.password = ['The password is incorrect.'];
    }

    if (Object.keys(payload).length > 0) {
      return apiError(
        422,
        'ValidationException',
        'The given data was invalid.',
        payload,
      );
    }

    return HttpResponse.json({ device_session_token: DEVICE_SESSION_TOKEN });
  }),

  http.post('/auth/token/issue', async ({ request }) => {
    const headerError = requestedWithError(request);
    if (headerError) return headerError;
    const tokenError = csrfError(request);
    if (tokenError) return tokenError;
    const parsed = issueSessionSchema.safeParse(await readJson(request));

    if (
      !parsed.success ||
      parsed.data.device_session_token !== DEVICE_SESSION_TOKEN
    ) {
      return apiError(
        422,
        'ValidationException',
        'The given data was invalid.',
      );
    }

    issueSession();
    return HttpResponse.json({ success: true });
  }),

  http.post('/auth/token/rotate', async ({ request }) => {
    const headerError = requestedWithError(request);
    if (headerError) return headerError;
    const tokenError = csrfError(request);
    if (tokenError) return tokenError;
    const parsed = sessionFingerprintSchema.safeParse(await readJson(request));

    if (!parsed.success || !rotateSession()) {
      return apiError(400, 'BadRequestException', 'Session cannot be rotated.');
    }

    // Keep concurrent expired requests in flight long enough to exercise
    // the client's single-flight recovery path.
    await delay(25);
    return HttpResponse.json({ success: true });
  }),

  http.post('/auth/token/revoke', async ({ request }) => {
    const headerError = requestedWithError(request);
    if (headerError) return headerError;
    const tokenError = csrfError(request);
    if (tokenError) return tokenError;
    const parsed = sessionFingerprintSchema.safeParse(await readJson(request));
    if (!parsed.success) {
      return apiError(400, 'BadRequestException', 'Invalid fingerprint.');
    }
    revokeSession();
    return new HttpResponse(null, { status: 204 });
  }),

  http.get(
    '/v1/me',
    withSession(() => HttpResponse.json(mockUser)),
  ),

  http.get(
    '/v1/webhooks',
    withSession(({ request }) => {
      const url = new URL(request.url);
      const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
      const limit = 10;
      const search = url.searchParams.get('search') ?? '';
      return HttpResponse.json(listWebhooks(page, limit, search));
    }),
  ),

  http.get(
    '/v1/webhooks/:id',
    withSession(({ params }) => {
      const webhook = findWebhook(Number(params.id));
      return webhook
        ? HttpResponse.json(webhook)
        : apiError(404, 'NotFoundException', 'Webhook not found.');
    }),
  ),

  http.put(
    '/v1/webhooks/:id',
    withSession(async ({ request, params }) => {
      const tokenError = csrfError(request);
      if (tokenError) return tokenError;
      const parsed = webhookUpdateSchema.safeParse(await readJson(request));
      if (!parsed.success) {
        return apiError(
          422,
          'ValidationException',
          'The given data was invalid.',
          fieldErrors(parsed.error.issues),
        );
      }

      const updated = updateWebhook(Number(params.id), parsed.data);

      return updated
        ? HttpResponse.json(updated)
        : apiError(404, 'NotFoundException', 'Webhook not found.');
    }),
  ),
];
