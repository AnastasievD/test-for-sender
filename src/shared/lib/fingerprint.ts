const FINGERPRINT_KEY = 'smart-sender:fingerprint';

const createFingerprint = () => {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
};

export const getFingerprint = () => {
  const existing = localStorage.getItem(FINGERPRINT_KEY);
  if (existing && /^[a-f0-9]{32}$/.test(existing)) return existing;

  const fingerprint = createFingerprint();
  localStorage.setItem(FINGERPRINT_KEY, fingerprint);
  return fingerprint;
};
