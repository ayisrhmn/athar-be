import { z } from "zod";

// Base Doa schema (matches Prisma model)
export const doaSchema = z.object({
  id: z.string().uuid(),
  apiId: z.number(),
  group: z.string(),
  name: z.string(),
  arabic: z.string(),
  latin: z.string(),
  meaning: z.string(),
  description: z.string(),
  tags: z.array(z.string()),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Response schema for single doa
export const doaResponseSchema = doaSchema;

// Response schema for list of doa
export const doaListResponseSchema = z.array(doaSchema);

// Query params for list endpoint
export const doaQuerySchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
  search: z.string().optional(),
  group: z.string().optional(),
});

// Path params for single doa
export const doaParamsSchema = z.object({
  apiId: z.coerce.number(),
});

// Pagination meta schema
export const paginationMetaSchema = z.object({
  currentPage: z.number(),
  totalPages: z.number(),
  totalItems: z.number(),
  itemsPerPage: z.number(),
  hasNextPage: z.boolean(),
  hasPrevPage: z.boolean(),
});

// Types
export type Doa = z.infer<typeof doaSchema>;
export type DoaQuery = z.infer<typeof doaQuerySchema>;
export type DoaParams = z.infer<typeof doaParamsSchema>;
export type PaginationMeta = z.infer<typeof paginationMetaSchema>;
