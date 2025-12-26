import type { FastifyReply, FastifyRequest } from "fastify";
import type { PrismaClient } from "@prisma/client";
import { DoaService } from "../services/doa.service";
import { successResponse, errorResponse } from "../utils/response";
import type { DoaQuery } from "../schemas/doa.schema";

export class DoaController {
  private doaService: DoaService;

  constructor(prisma: PrismaClient) {
    this.doaService = new DoaService(prisma);
  }

  /**
   * GET /doa
   * List all doa with pagination and optional filtering
   */
  findAll = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const query = request.query as DoaQuery;

      const { data, meta } = await this.doaService.findAll(query);

      return reply.send({
        ...successResponse(data),
        meta,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to fetch doa";
      return reply.status(500).send(errorResponse(message, 500));
    }
  };

  /**
   * GET /doa/:apiId
   * Get single doa by API ID
   */
  findById = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { apiId } = request.params as { apiId: number };
      const doa = await this.doaService.findByApiId(apiId);

      if (!doa) {
        return reply.status(404).send(errorResponse("Doa not found", 404));
      }

      return reply.send(successResponse(doa));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to fetch doa";
      return reply.status(500).send(errorResponse(message, 500));
    }
  };

  /**
   * GET /doa/groups
   * Get all available doa groups for filtering
   */
  getGroups = async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      const groups = await this.doaService.getGroups();
      return reply.send(successResponse(groups));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to fetch groups";
      return reply.status(500).send(errorResponse(message, 500));
    }
  };
}
