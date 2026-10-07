import { afterAll, afterEach, beforeAll } from 'vitest';
import { resetAuthRecovery } from '../api/authRecovery';
import { resetCsrfToken } from '../api/csrf';
import { resetDatabase } from '../mocks/database';
import { server } from '../mocks/server';
import { resetSession } from '../mocks/session';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

afterEach(() => {
  server.resetHandlers();
  resetAuthRecovery();
  resetCsrfToken();
  resetDatabase();
  resetSession();
  localStorage.clear();
});

afterAll(() => server.close());
