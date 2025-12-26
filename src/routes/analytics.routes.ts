import type { FastifyInstance } from "fastify";
import { AnalyticsService } from "../services/analytics.service";
import { AnalyticsController } from "../controllers/analytics.controller";
import {
  analyticsQuerySchema,
  topEndpointsQuerySchema,
  analyticsSummarySchema,
  dailyStatsSchema,
  analyticsEndpointSchema,
  contentPopularitySchema,
} from "../schemas/analytics.schema";
import { baseResponseSchema } from "../schemas/common.schema";
import { env } from "../plugins/env";

export async function analyticsRoutes(app: FastifyInstance) {
  const analyticsService = new AnalyticsService(app.prisma);
  const analyticsController = new AnalyticsController(analyticsService);

  const prefix = `${env.API_PREFIX}/analytics`;

  // GET /api/v1/analytics/summary - Get analytics overview
  app.get(
    `${prefix}/summary`,
    {
      schema: {
        description: "Get analytics summary (total hits, popular endpoints, last 7 days stats)",
        tags: ["Analytics"],
        response: {
          200: baseResponseSchema.extend({
            data: analyticsSummarySchema,
          }),
        },
      },
    },
    analyticsController.getSummary.bind(analyticsController)
  );

  // GET /api/v1/analytics/daily - Get daily statistics
  app.get(
    `${prefix}/daily`,
    {
      schema: {
        description: "Get daily statistics for the last N days",
        tags: ["Analytics"],
        querystring: analyticsQuerySchema,
        response: {
          200: baseResponseSchema.extend({
            data: dailyStatsSchema.array(),
          }),
        },
      },
    },
    analyticsController.getDailyStats.bind(analyticsController)
  );

  // GET /api/v1/analytics/popular-endpoints - Get most accessed endpoints
  app.get(
    `${prefix}/popular-endpoints`,
    {
      schema: {
        description: "Get most popular API endpoints",
        tags: ["Analytics"],
        querystring: topEndpointsQuerySchema,
        response: {
          200: baseResponseSchema.extend({
            data: analyticsEndpointSchema.array(),
          }),
        },
      },
    },
    analyticsController.getPopularEndpoints.bind(analyticsController)
  );

  // GET /api/v1/analytics/content-popularity - Get most accessed content
  app.get(
    `${prefix}/content-popularity`,
    {
      schema: {
        description: "Get most popular content (surahs, juz, duas)",
        tags: ["Analytics"],
        response: {
          200: baseResponseSchema.extend({
            data: contentPopularitySchema,
          }),
        },
      },
    },
    analyticsController.getContentPopularity.bind(analyticsController)
  );
}
