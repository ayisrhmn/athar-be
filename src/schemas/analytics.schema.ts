import { z } from "zod";

// Query schema for analytics endpoints
export const analyticsQuerySchema = z.object({
  days: z.coerce.number().min(1).max(90).default(7),
});

export const topEndpointsQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(50).default(10),
});

// Response schemas
export const analyticsEndpointSchema = z.object({
  endpoint: z.string(),
  method: z.string(),
  hitCount: z.number(),
  lastHit: z.date(),
});

export const dailyStatsSchema = z.object({
  date: z.date(),
  totalHits: z.number(),
});

export const contentPopularitySchema = z.object({
  topSurahs: z.array(
    z.object({
      surahNumber: z.number(),
      hits: z.number(),
    })
  ),
  topJuz: z.array(
    z.object({
      juzNumber: z.number(),
      hits: z.number(),
    })
  ),
  topDoa: z.array(
    z.object({
      doaApiId: z.number(),
      hits: z.number(),
    })
  ),
});

export const analyticsSummarySchema = z.object({
  totalHits: z.number(),
  popularEndpoints: z.array(analyticsEndpointSchema),
  last7Days: z.array(dailyStatsSchema),
});

export type AnalyticsQuery = z.infer<typeof analyticsQuerySchema>;
export type TopEndpointsQuery = z.infer<typeof topEndpointsQuerySchema>;
