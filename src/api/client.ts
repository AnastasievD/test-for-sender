import {
  getSessionGeneration,
  notifySessionExpired,
  recoverSession,
} from './authRecovery';
import type { z } from 'zod';
import { getCsrfToken } from './csrf';
import { ApiError } from './errors';
import { getFingerprint } from '../shared/lib/fingerprint';

interface ApiRequestOptions<T> extends Omit<RequestInit, 'body'> {
  body?: unknown;
  authRecovery?: boolean;
  responseSchema?: z.ZodType<T>;
}

interface InternalRequestOptions<T> extends ApiRequestOptions<T> {
  authRetryAttempted?: boolean;
  csrfRetryAttempted?: boolean;
}

const parseBody = async <T>(
  response: Response,
  responseSchema?: z.ZodType<T>,
): Promise<T> => {
  if (response.status === 204) {
    return responseSchema
      ? responseSchema.parse(undefined)
      : (undefined as T);
  }
  if (!responseSchema) return undefined as T;
  const body: unknown = await response.json();
  return responseSchema.parse(body);
};

const executeRequest = async <T>(
  path: string,
  options: InternalRequestOptions<T>,
): Promise<T> => {
  const method = options.method?.toUpperCase() ?? 'GET';
  const csrfToken = await getCsrfToken();
  const headers = new Headers(options.headers);
  headers.set('X-Requested-With', 'XMLHttpRequest');

  if (method === 'POST' || method === 'PUT') {
    headers.set('X-CSRF-TOKEN', csrfToken);
  }
  if (options.body !== undefined) headers.set('Content-Type', 'application/json');

  const observedGeneration = getSessionGeneration();
  const {
    body,
    authRecovery: _authRecovery,
    authRetryAttempted: _authRetryAttempted,
    csrfRetryAttempted: _csrfRetryAttempted,
    ...requestOptions
  } = options;
  const requestInit: RequestInit = {
    ...requestOptions,
    headers,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  };
  const response = await fetch(new URL(path, window.location.origin), requestInit);

  if (response.status === 419 && !options.csrfRetryAttempted) {
    await getCsrfToken(true);
    return executeRequest<T>(path, { ...options, csrfRetryAttempted: true });
  }

  const shouldRecover = options.authRecovery !== false;
  if (
    response.status === 401 &&
    shouldRecover &&
    !options.authRetryAttempted
  ) {
    try {
      await recoverSession(observedGeneration, () =>
        executeRequest<void>('/auth/token/rotate', {
          method: 'POST',
          body: { fingerprint: getFingerprint() },
          authRecovery: false,
        }),
      );
      return await executeRequest<T>(path, {
        ...options,
        authRetryAttempted: true,
      });
    } catch (error) {
      await notifySessionExpired();
      throw error;
    }
  }

  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    const error = new ApiError(response.status, body);
    if (response.status === 401 && shouldRecover) {
      await notifySessionExpired();
    }
    throw error;
  }

  return parseBody(response, options.responseSchema);
};

export function apiRequest<T>(
  path: string,
  options: ApiRequestOptions<T> & { responseSchema: z.ZodType<T> },
): Promise<T>;
export function apiRequest(
  path: string,
  options?: ApiRequestOptions<void>,
): Promise<void>;
export function apiRequest<T>(
  path: string,
  options: ApiRequestOptions<T> = {},
) {
  return executeRequest(path, options);
}
