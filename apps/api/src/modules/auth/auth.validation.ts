import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  role: z.enum(['individual', 'organization']),
  // individual
  full_name: z.string().min(2).max(150).optional(),
  country: z.string().max(100).optional(),
  // organization
  legal_name: z.string().min(2).max(200).optional(),
  display_name: z.string().min(2).max(150).optional(),
  website: z.string().url().optional(),
}).refine((d) => {
  if (d.role === 'individual') return !!d.full_name;
  if (d.role === 'organization') return !!d.legal_name && !!d.display_name;
  return true;
}, { message: 'Missing required fields for the selected role' });

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const refreshSchema = z.object({
  refresh_token: z.string().min(1),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  new_password: z.string().min(8).max(128),
});

export const verifyEmailSchema = z.object({
  token: z.string().min(1),
});
