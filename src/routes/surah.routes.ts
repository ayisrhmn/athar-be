import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { env } from "../plugins/env";
import { SurahController } from "../controllers/surah.controller";
import {
  surahQuerySchema,
  surahParamsSchema,
  surahSchema,
  verseSchema,
  tafsirSchema,
} from "../schemas/surah.schema";
import {
  errorResponseSchema,
  paginationMetaSchema,
  baseResponseSchema,
} from "../schemas/common.schema";

export async function surahRoutes(app: FastifyInstance) {
  const controller = new SurahController(app.prisma);

  // GET /surah - List all surah
  app.withTypeProvider<ZodTypeProvider>().get(
    `${env.API_PREFIX}/surah`,
    {
      schema: {
        summary: "List all surah",
        description:
          "Get list of all surah (Quran chapters). Supports search by latin name or meaning.",
        tags: ["Surah"],
        querystring: surahQuerySchema,
        response: {
          200: baseResponseSchema.extend({
            data: z.array(
              surahSchema
                .omit({ description: true, audioFull: true, createdAt: true, updatedAt: true })
                .extend({
                  juz: z.array(z.number()),
                })
            ),
            meta: paginationMetaSchema,
          }),
          500: errorResponseSchema,
        },
      },
    },
    controller.findAll
  );

  // GET /surah/:number - Get surah detail with verses
  app.withTypeProvider<ZodTypeProvider>().get(
    `${env.API_PREFIX}/surah/:number`,
    {
      schema: {
        summary: "Get surah by number",
        description:
          "Get a single surah by its number (1-114) with all verses.",
        tags: ["Surah"],
        params: surahParamsSchema,
        response: {
          200: baseResponseSchema.extend({
            data: surahSchema.omit({ createdAt: true, updatedAt: true }).extend({
              verses: z.array(verseSchema.omit({ createdAt: true, updatedAt: true })),
              prevInfo: z.object({
                number: z.number(),
                name: z.string(),
                latinName: z.string(),
              }).nullable(),
              nextInfo: z.object({
                number: z.number(),
                name: z.string(),
                latinName: z.string(),
              }).nullable(),
            }),
          }),
          404: errorResponseSchema,
          500: errorResponseSchema,
        },
      },
    },
    controller.findByNumber
  );

  // GET /surah/:number/tafsir - Get surah with tafsir
  app.withTypeProvider<ZodTypeProvider>().get(
    `${env.API_PREFIX}/surah/:number/tafsir`,
    {
      schema: {
        summary: "Get surah tafsir",
        description:
          "Get tafsir (interpretation) for all verses in a surah.",
        tags: ["Surah"],
        params: surahParamsSchema,
        response: {
          200: baseResponseSchema.extend({
            data: surahSchema
              .omit({ audioFull: true, createdAt: true, updatedAt: true })
              .extend({
                tafsir: z.array(tafsirSchema.omit({ createdAt: true, updatedAt: true })),
                prevInfo: z.object({
                  number: z.number(),
                  name: z.string(),
                  latinName: z.string(),
                }).nullable(),
                nextInfo: z.object({
                  number: z.number(),
                  name: z.string(),
                  latinName: z.string(),
                }).nullable(),
              }),
          }),
          404: errorResponseSchema,
          500: errorResponseSchema,
        },
      },
    },
    controller.findTafsirByNumber
  );
}
