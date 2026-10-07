import { markSessionEstablished } from '../../api/authRecovery';
import { apiRequest } from '../../api/client';
import { getFingerprint } from '../../shared/lib/fingerprint';
import type { LoginCredentials, User } from './types';

export const login = async ({ email, password }: LoginCredentials) => {
  const fingerprint = getFingerprint();
  const { device_session_token } = await apiRequest<{
    device_session_token: string;
  }>('/auth/login', {
    method: 'POST',
    body: { email, password, fingerprint },
    headers: { 'X-Captcha-Token': 'test-captcha-token' },
    authRecovery: false,
  });

  await apiRequest<void>('/auth/token/issue', {
    method: 'POST',
    body: { device_session_token, fingerprint },
    authRecovery: false,
  });
  markSessionEstablished();

  return apiRequest<User>('/v1/me');
};

export const getMe = () => apiRequest<User>('/v1/me');

export const revoke = () =>
  apiRequest<void>('/auth/token/revoke', {
    method: 'POST',
    body: { fingerprint: getFingerprint() },
    authRecovery: false,
  });
