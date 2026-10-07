export const CSRF_TOKEN = 'smart-sender-csrf-token';
export const DEVICE_SESSION_TOKEN = 'mock-device-session-token';
export const SESSION_DURATION_MS = 30_000;

let issued = false;
let expiresAt = 0;
let rotateCount = 0;
let unauthorizedCount = 0;

export const issueSession = () => {
  issued = true;
  expiresAt = Date.now() + SESSION_DURATION_MS;
};

export const rotateSession = () => {
  if (!issued) return false;
  rotateCount += 1;
  expiresAt = Date.now() + SESSION_DURATION_MS;
  return true;
};

export const revokeSession = () => {
  issued = false;
  expiresAt = 0;
};

export const hasActiveSession = () => issued && expiresAt > Date.now();

export const resetSession = () => {
  issued = false;
  expiresAt = 0;
  rotateCount = 0;
  unauthorizedCount = 0;
};

export const expireSession = () => {
  expiresAt = Date.now() - 1;
};

export const getRotateCount = () => rotateCount;

export const recordUnauthorized = () => {
  unauthorizedCount += 1;
};

export const getUnauthorizedCount = () => unauthorizedCount;
