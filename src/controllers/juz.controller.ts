import type { FastifyReply, FastifyRequest } from "fastify";
import type { PrismaClient } from "@prisma/client";
import { JuzService } from "../services/juz.service";
import { successResponse, errorResponse } from "../utils/response";
import type {
  JuzParams,
  JuzSurahParams,
  JuzSurahQuery,
} from "../schemas/juz.schema";

export class JuzController {
  private juzService: JuzService;

  constructor(prisma: PrismaClient) {
    this.juzService = new JuzService(prisma);
  }

  /**
   * GET /juz
   * List all juz (1-30) with surahs info
   */
  findAll = async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = await this.juzService.findAll();
      return reply.send(successResponse(data));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to fetch juz";
      return reply.status(500).send(errorResponse(message, 500));
    }
  };

  /**
   * GET /juz/:number
   * Get juz detail with surahs and their verse range
   */
  findByNumber = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { number } = request.params as JuzParams;
      const juz = await this.juzService.findByNumber(number);

      if (!juz) {
        return reply.status(404).send(errorResponse("Juz not found", 404));
      }

      return reply.send(successResponse(juz));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to fetch juz";
      return reply.status(500).send(errorResponse(message, 500));
    }
  };

  /**
   * GET /juz/:number/surah/:surahNumber
   * Get surah verses filtered by juz (with optional verse filter)
   */
  findSurahByJuz = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { number, surahNumber } = request.params as JuzSurahParams;
      const query = request.query as JuzSurahQuery;
      const data = await this.juzService.findSurahByJuz(
        number,
        surahNumber,
        query
      );

      if (!data) {
        return reply
          .status(404)
          .send(errorResponse("Surah not found in this juz", 404));
      }

      return reply.send(successResponse(data));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to fetch surah";
      return reply.status(500).send(errorResponse(message, 500));
    }
  };

  /**
   * GET /juz/:number/surah/:surahNumber/tafsir
   * Get surah tafsir filtered by juz (with optional verse filter)
   */
  findSurahTafsirByJuz = async (
    request: FastifyRequest,
    reply: FastifyReply
  ) => {
    try {
      const { number, surahNumber } = request.params as JuzSurahParams;
      const query = request.query as JuzSurahQuery;
      const data = await this.juzService.findSurahTafsirByJuz(
        number,
        surahNumber,
        query
      );

      if (!data) {
        return reply
          .status(404)
          .send(errorResponse("Surah not found in this juz", 404));
      }

      return reply.send(successResponse(data));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to fetch tafsir";
      return reply.status(500).send(errorResponse(message, 500));
    }
  };
}
