import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { env } from "../plugins/env";
import { healthResponseSchema } from "../schemas/common.schema";

export async function healthRoutes(app: FastifyInstance) {
  // Health check endpoint
  app.withTypeProvider<ZodTypeProvider>().get(
    `${env.API_PREFIX}/health`,
    {
      schema: {
        summary: "Health check",
        description:
          "Check if the API and database are running properly. Used for monitoring and load balancing.",
        tags: ["Health"],
        response: {
          200: healthResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const startTime = Date.now();
      let dbStatus: "connected" | "disconnected" = "disconnected";

      try {
        // Check database connection
        await app.prisma.$queryRaw`SELECT 1`;
        dbStatus = "connected";
      } catch (err) {
        request.log.error({ err }, "Database health check failed");
      }

      const responseTime = Date.now() - startTime;

      return reply.status(200).send({
        status: dbStatus === "connected" ? "ok" : "error",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: dbStatus,
        version: "1.0.0",
      });
    }
  );
}
