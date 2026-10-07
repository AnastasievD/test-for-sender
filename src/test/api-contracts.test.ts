import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';
import { ZodError } from 'zod';
import { getMe, login } from '../features/auth/api';
import { server } from '../mocks/server';
import { TEST_CREDENTIALS } from '../shared/config/constants';

describe('API response contracts', () => {
  it('rejects a malformed response instead of trusting its TypeScript type', async () => {
    await login(TEST_CREDENTIALS);
    server.use(
      http.get('/v1/me', () =>
        HttpResponse.json({ id: 'not-a-number', email: 'broken response' }),
      ),
    );

    await expect(getMe()).rejects.toBeInstanceOf(ZodError);
  });
});
