import { z } from 'zod';

export const fingerprintSchema = z
  .string()
  .regex(/^[a-f0-9]{32}$/, 'The fingerprint must contain 32 hex characters.');

export const loginInputSchema = z.object({
  email: z.string().trim().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

export const loginRequestSchema = loginInputSchema.extend({
  fingerprint: fingerprintSchema,
});

export const deviceSessionSchema = z.object({
  device_session_token: z.string().min(1),
});

export const sessionFingerprintSchema = z.object({
  fingerprint: fingerprintSchema,
});

export const issueSessionSchema = sessionFingerprintSchema.extend({
  device_session_token: z.string().min(1),
});

export const userSchema = z.object({
  id: z.number().int().positive(),
  email: z.string().email(),
  first_name: z.string(),
  last_name: z.string(),
  name: z.string(),
});

export type LoginInput = z.infer<typeof loginInputSchema>;
export type User = z.infer<typeof userSchema>;
