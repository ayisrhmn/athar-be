import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { env } from "../plugins/env";
import { JuzController } from "../controllers/juz.controller";
import {
  juzParamsSchema,
  juzSurahParamsSchema,
  juzSurahQuerySchema,
} from "../schemas/juz.schema";
import { verseSchema, tafsirSchema } from "../schemas/surah.schema";
import {
  baseResponseSchema,
  errorResponseSchema,
} from "../schemas/common.schema";

export async function juzRoutes(app: FastifyInstance) {
  const controller = new JuzController(app.prisma);

  // GET /juz - List all juz
  app.withTypeProvider<ZodTypeProvider>().get(
    `${env.API_PREFIX}/juz`,
    {
      schema: {
        summary: "List all juz",
        description:
          "Get list of all 30 juz with their surah info and verse range",
        tags: ["Juz"],
        response: {
          200: baseResponseSchema.extend({
            data: z.array(
              z.object({
                number: z.number(),
                start: z.object({
                  surah: z.number(),
                  verse: z.number(),
                }),
                end: z.object({
                  surah: z.number(),
                  verse: z.number(),
                }),
                totalVerses: z.number(),
                surahs: z.array(
                  z.object({
                    number: z.number(),
                    name: z.string(),
                    latinName: z.string(),
                  })
                ),
              })
            ),
          }),
          500: errorResponseSchema,
        },
      },
    },
    controller.findAll
  );

  // GET /juz/:number - Get juz detail
  app.withTypeProvider<ZodTypeProvider>().get(
    `${env.API_PREFIX}/juz/:number`,
    {
      schema: {
        summary: "Get juz by number",
        description:
          "Get a single juz (1-30) with list of surahs and their verse range in this juz",
        tags: ["Juz"],
        params: juzParamsSchema,
        response: {
          200: baseResponseSchema.extend({
            data: z.object({
              number: z.number(),
              start: z.object({
                surah: z.number(),
                verse: z.number(),
              }),
              end: z.object({
                surah: z.number(),
                verse: z.number(),
              }),
              totalVerses: z.number(),
              surahs: z.array(
                z.object({
                  number: z.number(),
                  name: z.string(),
                  latinName: z.string(),
                  verseCount: z.number(),
                  revelationPlace: z.string(),
                  meaning: z.string(),
                  versesInJuz: z.object({
                    start: z.number(),
                    end: z.number(),
                  }),
                  totalVersesInJuz: z.number(),
                })
              ),
              prevInfo: z.object({
                number: z.number(),
              }).nullable(),
              nextInfo: z.object({
                number: z.number(),
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

  // GET /juz/:number/surah/:surahNumber - Get surah verses by juz
  app.withTypeProvider<ZodTypeProvider>().get(
    `${env.API_PREFIX}/juz/:number/surah/:surahNumber`,
    {
      schema: {
        summary: "Get surah verses by juz",
        description:
          "Get verses of a surah that belongs to a specific juz. Use query params to filter specific verses.",
        tags: ["Juz"],
        params: juzSurahParamsSchema,
        querystring: juzSurahQuerySchema,
        response: {
          200: baseResponseSchema.extend({
            data: z.object({
              juz: z.number(),
              surah: z.object({
                id: z.string(),
                number: z.number(),
                name: z.string(),
                latinName: z.string(),
                verseCount: z.number(),
                revelationPlace: z.string(),
                meaning: z.string(),
                description: z.string(),
              }),
              verses: z.array(verseSchema.omit({ createdAt: true, updatedAt: true })),
              prevInfo: z.object({
                juz: z.number(),
                surah: z.object({
                  number: z.number(),
                  name: z.string(),
                  latinName: z.string(),
                }).nullable(),
              }).nullable(),
              nextInfo: z.object({
                juz: z.number(),
                surah: z.object({
                  number: z.number(),
                  name: z.string(),
                  latinName: z.string(),
                }).nullable(),
              }).nullable(),
            }),
          }),
          404: errorResponseSchema,
          500: errorResponseSchema,
        },
      },
    },
    controller.findSurahByJuz
  );

  // GET /juz/:number/surah/:surahNumber/tafsir - Get surah tafsir by juz
  app.withTypeProvider<ZodTypeProvider>().get(
    `${env.API_PREFIX}/juz/:number/surah/:surahNumber/tafsir`,
    {
      schema: {
        summary: "Get surah tafsir by juz",
        description:
          "Get tafsir of a surah that belongs to a specific juz. Use query params to filter specific verses.",
        tags: ["Juz"],
        params: juzSurahParamsSchema,
        querystring: juzSurahQuerySchema,
        response: {
          200: baseResponseSchema.extend({
            data: z.object({
              juz: z.number(),
              surah: z.object({
                id: z.string(),
                number: z.number(),
                name: z.string(),
                latinName: z.string(),
                verseCount: z.number(),
                revelationPlace: z.string(),
                meaning: z.string(),
                description: z.string(),
              }),
              tafsir: z.array(tafsirSchema.omit({ createdAt: true, updatedAt: true })),
              prevInfo: z.object({
                juz: z.number(),
                surah: z.object({
                  number: z.number(),
                  name: z.string(),
                  latinName: z.string(),
                }).nullable(),
              }).nullable(),
              nextInfo: z.object({
                juz: z.number(),
                surah: z.object({
                  number: z.number(),
                  name: z.string(),
                  latinName: z.string(),
                }).nullable(),
              }).nullable(),
            }),
          }),
          404: errorResponseSchema,
          500: errorResponseSchema,
        },
      },
    },
    controller.findSurahTafsirByJuz
  );
}
