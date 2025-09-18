import { z } from 'zod';

export const paginationSchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().positive()).default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().positive().max(100)).default('10'),
});

export const searchSchema = z.object({
  query: z.string().min(1, 'Search query is required').max(100, 'Search query is too long'),
});

export const idParamSchema = z.object({
  id: z.string().uuid('Invalid ID format'),
});

export type PaginationInput = z.infer<typeof paginationSchema>;
export type SearchInput = z.infer<typeof searchSchema>;
export type IdParamInput = z.infer<typeof idParamSchema>;