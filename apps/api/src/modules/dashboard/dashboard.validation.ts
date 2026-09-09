import { z } from 'zod';

export const dashboardQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  date_from: z.string().datetime().optional(),
  date_to: z.string().datetime().optional(),
});
