FROM oven/bun:latest

WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl

COPY package.json bun.lock* ./

RUN bun install --frozen-lockfile

COPY . .

# Generate Prisma Client
RUN bun run prisma-generate

# Run database migrations
RUN bun run prisma migrate deploy

# Seed database (production data)
RUN bun run seed:surah && bun run seed:tafsir && bun run seed:doa || true

EXPOSE 3099

CMD ["bun", "run", "start"]
