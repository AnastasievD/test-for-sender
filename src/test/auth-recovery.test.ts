import { describe, expect, it } from 'vitest';
import { getMe, login } from '../features/auth/api';
import { getWebhooks } from '../features/webhooks/api';
import { TEST_CREDENTIALS } from '../mocks/database';
import {
  expireSession,
  getRotateCount,
  getUnauthorizedCount,
} from '../mocks/session';

describe('session recovery', () => {
  it('shares one rotate between two concurrent unauthorized requests', async () => {
    await login(TEST_CREDENTIALS);
    expireSession();

    const [user, webhooks] = await Promise.all([
      getMe(),
      getWebhooks({ page: 1, search: '' }),
    ]);

    expect(user.email).toBe(TEST_CREDENTIALS.email);
    expect(webhooks.data).toHaveLength(10);
    expect(getUnauthorizedCount()).toBe(2);
    expect(getRotateCount()).toBe(1);
  });
});
