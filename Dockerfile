FROM oven/bun:latest

WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl

COPY package.json bun.lock* ./

RUN bun install --frozen-lockfile

COPY . .

# Generate Prisma Client
RUN bun run prisma-generate

EXPOSE 3099

# Run migrations & seed at runtime (when DATABASE_URL is available)
CMD ["sh", "-c", "bun run prisma migrate deploy && bun run seed:doa && bun run seed:surah && bun run seed:tafsir || true && bun run start"]
