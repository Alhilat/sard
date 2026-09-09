import { z } from 'zod';

export const updateProfileSchema = z.object({
  full_name: z.string().min(2).max(150).optional(),
  bio: z.string().max(1000).optional(),
  country: z.string().max(100).optional(),
  interests: z.array(z.string()).optional(),
  privacy_settings: z.record(z.unknown()).optional(),
});

export const changePasswordSchema = z.object({
  current_password: z.string().min(1),
  new_password: z.string().min(8).max(128),
});
