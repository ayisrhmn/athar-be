import type { FastifyReply, FastifyRequest } from "fastify";
import type { PrismaClient } from "@prisma/client";
import { SurahService } from "../services/surah.service";
import { successResponse, errorResponse } from "../utils/response";
import type {
  SurahQuery,
  SurahParams,
  SurahDetailQuery,
} from "../schemas/surah.schema";

export class SurahController {
  private surahService: SurahService;

  constructor(prisma: PrismaClient) {
    this.surahService = new SurahService(prisma);
  }

  /**
   * GET /surah
   * List all surah with optional search
   */
  findAll = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const query = request.query as SurahQuery;
      const { data, meta } = await this.surahService.findAll(query);

      return reply.send({
        ...successResponse(data),
        meta,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to fetch surah";
      return reply.status(500).send(errorResponse(message, 500));
    }
  };

  /**
   * GET /surah/:number
   * Get single surah by number with verses (optional filter)
   */
  findByNumber = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { number } = request.params as SurahParams;
      const query = request.query as SurahDetailQuery;
      const surah = await this.surahService.findByNumber(number, query);

      if (!surah) {
        return reply.status(404).send(errorResponse("Surah not found", 404));
      }

      return reply.send(successResponse(surah));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to fetch surah";
      return reply.status(500).send(errorResponse(message, 500));
    }
  };

  /**
   * GET /surah/:number/tafsir
   * Get surah with tafsir (optional verse filter)
   */
  findTafsirByNumber = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { number } = request.params as SurahParams;
      const query = request.query as SurahDetailQuery;
      const surahWithTafsir = await this.surahService.findTafsirByNumber(
        number,
        query
      );

      if (!surahWithTafsir) {
        return reply.status(404).send(errorResponse("Surah not found", 404));
      }

      return reply.send(successResponse(surahWithTafsir));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to fetch tafsir";
      return reply.status(500).send(errorResponse(message, 500));
    }
  };
}
