FROM oven/bun:latest

WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl

COPY package.json bun.lock* ./

RUN bun install --frozen-lockfile

COPY . .

RUN bun run prisma-generate

RUN bun run build

EXPOSE 3099

CMD ["bun", "run", "start"]
