import { ApiError } from './errors';

let csrfToken: string | null = null;
let csrfPromise: Promise<string> | null = null;

const requestCsrfToken = async () => {
  const response = await fetch(new URL('/csrf', window.location.origin), {
    headers: { 'X-Requested-With': 'XMLHttpRequest' },
  });

  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    throw new ApiError(response.status, body);
  }

  const token = response.headers.get('X-CSRF-TOKEN');
  if (!token) throw new Error('CSRF response did not include X-CSRF-TOKEN.');
  csrfToken = token;
  return token;
};

export const getCsrfToken = (forceRefresh = false) => {
  if (forceRefresh) csrfToken = null;
  if (csrfToken) return Promise.resolve(csrfToken);

  csrfPromise ??= requestCsrfToken().finally(() => {
    csrfPromise = null;
  });

  return csrfPromise;
};

export const resetCsrfToken = () => {
  csrfToken = null;
  csrfPromise = null;
};
