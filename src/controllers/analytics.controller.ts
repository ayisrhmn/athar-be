import { AnalyticsService } from "../services/analytics.service";
import type { FastifyRequest, FastifyReply } from "fastify";
import type { AnalyticsQuery, TopEndpointsQuery } from "../schemas/analytics.schema";

export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  async getSummary(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    const summary = await this.analyticsService.getSummary();

    reply.send({
      status: 200,
      message: "Analytics summary retrieved successfully",
      data: summary,
    });
  }

  async getDailyStats(
    request: FastifyRequest<{ Querystring: AnalyticsQuery }>,
    reply: FastifyReply
  ): Promise<void> {
    const { days } = request.query;
    const stats = await this.analyticsService.getDailyStats(days);

    reply.send({
      status: 200,
      message: `Daily stats for last ${days} days retrieved successfully`,
      data: stats,
    });
  }

  async getPopularEndpoints(
    request: FastifyRequest<{ Querystring: TopEndpointsQuery }>,
    reply: FastifyReply
  ): Promise<void> {
    const { limit } = request.query;
    const endpoints = await this.analyticsService.getPopularEndpoints(limit);

    reply.send({
      status: 200,
      message: `Top ${limit} popular endpoints retrieved successfully`,
      data: endpoints,
    });
  }

  async getContentPopularity(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    const popularity = await this.analyticsService.getContentPopularity();

    reply.send({
      status: 200,
      message: "Content popularity retrieved successfully",
      data: popularity,
    });
  }
}
