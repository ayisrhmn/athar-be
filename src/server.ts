import fastify from "fastify";
import { env } from "./plugins/env";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUI from "@fastify/swagger-ui";
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
} from "fastify-type-provider-zod";
import prismaPlugin from "./plugins/prisma";
import { doaRoutes } from "./routes/doa.routes";
import { surahRoutes } from "./routes/surah.routes";
import { juzRoutes } from "./routes/juz.routes";
import { healthRoutes } from "./routes/health.routes";
import { analyticsRoutes } from "./routes/analytics.routes";
import { AnalyticsService } from "./services/analytics.service";

// Initialize Fastify with logger
export const app = fastify({
  logger: {
    level: env.NODE_ENV === "production" ? "info" : "debug",
    transport:
      env.NODE_ENV === "development"
        ? {
            target: "pino-pretty",
            options: {
              colorize: true,
              translateTime: "HH:MM:ss Z",
              ignore: "pid,hostname",
            },
          }
        : undefined,
  },
});

// Enable CORS with environment-based configuration
const corsOrigin = env.CORS_ORIGIN === "*" ? "*" : env.CORS_ORIGIN.split(",");
app.register(cors, {
  origin: corsOrigin,
  credentials: true,
});

// Enable rate limiting
app.register(rateLimit, {
  max: env.RATE_LIMIT_MAX,
  timeWindow: env.RATE_LIMIT_TIME_WINDOW,
  errorResponseBuilder: () => ({
    status: 429,
    message: "Too many requests, please try again later",
    data: null,
  }),
});

// Swagger setup (only in development)
if (env.NODE_ENV === "development") {
  app.register(fastifySwagger, {
    openapi: {
      info: {
        title: "Athar API",
        description: "API for Athar App - Islamic Content",
        version: "1.0.0",
      },
    },
    transform: jsonSchemaTransform,
  });

  app.register(fastifySwaggerUI, {
    routePrefix: "/docs",
    uiConfig: {
      docExpansion: "list",
    },
    staticCSP: true,
  });
}

// Zod setup
app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

// Register prisma plugin
app.register(prismaPlugin);

// Register analytics hook (after prisma)
app.addHook("onResponse", async (request, reply) => {
  // Skip analytics tracking for health check, docs, and static assets
  if (
    request.url.includes("/health") ||
    request.url.includes("/docs") ||
    request.url.includes("/static")
  ) {
    return;
  }

  // Track analytics asynchronously (non-blocking)
  const analyticsService = new AnalyticsService(app.prisma);
  
  // Remove query params from endpoint for cleaner grouping
  const endpoint = request.url?.split("?")[0] || request.url || "/unknown";
  
  // Fire and forget - don't await to avoid blocking response
  analyticsService
    .trackHit(endpoint, request.method)
    .catch((err) => {
      // Silent fail - log but don't throw
      request.log.error("Analytics tracking failed:", err);
    });
});

// Register routes
app.register(healthRoutes);
app.register(analyticsRoutes);
app.register(doaRoutes);
app.register(surahRoutes);
app.register(juzRoutes);

// Global error handler
app.setErrorHandler((err, request, reply) => {
  // Type guard for Fastify errors
  const error = err as Error & {
    statusCode?: number;
    code?: string;
    validation?: unknown[];
  };

  const statusCode = error.statusCode ?? 500;

  // Log error
  request.log.error({
    error: {
      message: error.message,
      stack: error.stack,
      statusCode,
      code: error.code,
    },
    request: {
      method: request.method,
      url: request.url,
    },
  });

  // Send error response (don't expose stack trace in production)
  reply.status(statusCode).send({
    status: statusCode,
    message:
      statusCode === 500 && env.NODE_ENV === "production"
        ? "Internal server error"
        : error.message,
    data: null,
    error: {
      code: error.code,
      ...(env.NODE_ENV === "development" && { stack: error.stack }),
      ...(error.validation && { validation: error.validation }),
    },
  });
});

// Run server
app.listen({ port: env.PORT, host: "0.0.0.0" }).then(() => {
  app.log.info(`🚀 Athar API server running on port ${env.PORT}`);
  if (env.NODE_ENV === "development") {
    app.log.info(
      `📚 API Documentation: http://localhost:${env.PORT}/docs`
    );
  }
  app.log.info(
    `❤️  Health Check: http://localhost:${env.PORT}${env.API_PREFIX}/health`
  );
});
