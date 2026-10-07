import { delay, http, HttpResponse, type HttpResponseResolver } from 'msw';
import type { WebhookUpdate } from '../features/webhooks/types';
import {
  findWebhook,
  listWebhooks,
  mockUser,
  TEST_CREDENTIALS,
  updateWebhook,
} from './database';
import {
  CSRF_TOKEN,
  DEVICE_SESSION_TOKEN,
  hasActiveSession,
  issueSession,
  recordUnauthorized,
  revokeSession,
  rotateSession,
} from './session';

type ErrorType =
  | 'BadRequestException'
  | 'AuthenticationException'
  | 'NotFoundException'
  | 'TokenMismatchException'
  | 'ValidationException';

const apiError = (
  status: number,
  type: ErrorType,
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

const isFingerprint = (value: unknown): value is string =>
  typeof value === 'string' && /^[a-f0-9]{32}$/.test(value);

const isHttpUrl = (value: string) => {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
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

    const body = (await request.json()) as Record<string, unknown>;
    const payload: Record<string, string[]> = {};

    if (body.email !== TEST_CREDENTIALS.email) {
      payload.email = ['The selected email is invalid.'];
    }
    if (body.password !== TEST_CREDENTIALS.password) {
      payload.password = ['The password is incorrect.'];
    }
    if (!isFingerprint(body.fingerprint)) {
      payload.fingerprint = ['The fingerprint must contain 32 hex characters.'];
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
    const body = (await request.json()) as Record<string, unknown>;

    if (
      body.device_session_token !== DEVICE_SESSION_TOKEN ||
      !isFingerprint(body.fingerprint)
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
    const body = (await request.json()) as Record<string, unknown>;

    if (!isFingerprint(body.fingerprint) || !rotateSession()) {
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
      const body = (await request.json()) as Partial<WebhookUpdate>;
      const payload: Record<string, string[]> = {};

      if (!body.name?.trim()) payload.name = ['The name field is required.'];
      if (!body.url || !isHttpUrl(body.url)) {
        payload.url = ['The url must be a valid HTTP/HTTPS URL.'];
      }

      if (Object.keys(payload).length > 0) {
        return apiError(
          422,
          'ValidationException',
          'The given data was invalid.',
          payload,
        );
      }

      const updated = updateWebhook(Number(params.id), {
        name: body.name!.trim(),
        url: body.url!,
      });

      return updated
        ? HttpResponse.json(updated)
        : apiError(404, 'NotFoundException', 'Webhook not found.');
    }),
  ),
];
