import { markSessionEstablished } from '../../api/authRecovery';
import { apiRequest } from '../../api/client';
import { getFingerprint } from '../../shared/lib/fingerprint';
import {
  deviceSessionSchema,
  userSchema,
  type LoginInput,
} from './schema';

export const login = async ({ email, password }: LoginInput) => {
  const fingerprint = getFingerprint();
  const { device_session_token } = await apiRequest('/auth/login', {
    method: 'POST',
    body: { email, password, fingerprint },
    headers: { 'X-Captcha-Token': 'test-captcha-token' },
    authRecovery: false,
    responseSchema: deviceSessionSchema,
  });

  await apiRequest('/auth/token/issue', {
    method: 'POST',
    body: { device_session_token, fingerprint },
    authRecovery: false,
  });
  markSessionEstablished();

  return apiRequest('/v1/me', { responseSchema: userSchema });
};

export const getMe = () => apiRequest('/v1/me', { responseSchema: userSchema });

export const revoke = () =>
  apiRequest('/auth/token/revoke', {
    method: 'POST',
    body: { fingerprint: getFingerprint() },
    authRecovery: false,
  });
