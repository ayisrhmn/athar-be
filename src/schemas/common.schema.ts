import { z } from "zod";

/**
 * Common response schemas used across all APIs
 */

// Base response structure
export const baseResponseSchema = z.object({
  status: z.number(),
  message: z.string(),
});

// Success response with data
export const successResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  baseResponseSchema.extend({
    data: dataSchema,
  });

// Error response (no data)
export const errorResponseSchema = baseResponseSchema.extend({
  data: z.null(),
  error: z
    .object({
      code: z.string().optional(),
      details: z.any().optional(),
    })
    .optional(),
});

// Pagination metadata
export const paginationMetaSchema = z.object({
  currentPage: z.number(),
  totalPages: z.number(),
  totalItems: z.number(),
  itemsPerPage: z.number(),
  hasNextPage: z.boolean(),
  hasPrevPage: z.boolean(),
});

// Success response with pagination
export const paginatedResponseSchema = <T extends z.ZodTypeAny>(
  dataSchema: T
) =>
  baseResponseSchema.extend({
    data: z.array(dataSchema),
    meta: paginationMetaSchema,
  });

// Health check response
export const healthResponseSchema = z.object({
  status: z.enum(["ok", "error"]),
  timestamp: z.string(),
  uptime: z.number(),
  database: z.enum(["connected", "disconnected"]),
  version: z.string(),
});
