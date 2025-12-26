import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { env } from "../plugins/env";
import { DoaController } from "../controllers/doa.controller";
import { doaQuerySchema, doaParamsSchema } from "../schemas/doa.schema";

// Shared response schemas using Zod
const baseResponseSchema = z.object({
  status: z.number(),
  message: z.string(),
});

const errorResponseSchema = baseResponseSchema.extend({
  data: z.null(),
});

const paginationMetaSchema = z.object({
  currentPage: z.number(),
  totalPages: z.number(),
  totalItems: z.number(),
  itemsPerPage: z.number(),
  hasNextPage: z.boolean(),
  hasPrevPage: z.boolean(),
});

export async function doaRoutes(app: FastifyInstance) {
  const controller = new DoaController(app.prisma);

  // GET /doa - List all doa with pagination
  app.withTypeProvider<ZodTypeProvider>().get(
    `${env.API_PREFIX}/doa`,
    {
      schema: {
        summary: "List all doa",
        description:
          "Get paginated list of doa (prayers). Supports search, filtering by group, and pagination.",
        tags: ["Doa"],
        querystring: doaQuerySchema,
        response: {
          200: baseResponseSchema.extend({
            data: z.array(z.any()),
            meta: paginationMetaSchema,
          }),
          500: errorResponseSchema,
        },
      },
    },
    controller.findAll
  );

  // GET /doa/groups - Get all doa groups (must be before :id route)
  app.withTypeProvider<ZodTypeProvider>().get(
    `${env.API_PREFIX}/doa/groups`,
    {
      schema: {
        summary: "Get all doa groups",
        description: "Get list of all available doa groups/categories",
        tags: ["Doa"],
        response: {
          200: baseResponseSchema.extend({
            data: z.array(z.string()),
          }),
          500: errorResponseSchema,
        },
      },
    },
    controller.getGroups
  );

  // GET /doa/:apiId - Get single doa by API ID
  app.withTypeProvider<ZodTypeProvider>().get(
    `${env.API_PREFIX}/doa/:apiId`,
    {
      schema: {
        summary: "Get doa by API ID",
        description: "Get a single doa (prayer) by its API ID from external source",
        tags: ["Doa"],
        params: doaParamsSchema,
        response: {
          200: baseResponseSchema.extend({
            data: z.object({
              id: z.string(),
              apiId: z.number(),
              group: z.string(),
              name: z.string(),
              arabic: z.string(),
              latin: z.string(),
              meaning: z.string(),
              description: z.string(),
              tags: z.array(z.string()),
              prevInfo: z.object({
                apiId: z.number(),
                name: z.string(),
              }).nullable(),
              nextInfo: z.object({
                apiId: z.number(),
                name: z.string(),
              }).nullable(),
            }),
          }),
          404: errorResponseSchema,
          500: errorResponseSchema,
        },
      },
    },
    controller.findById
  );
}
