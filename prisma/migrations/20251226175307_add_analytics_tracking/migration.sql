-- CreateTable
CREATE TABLE "analytics" (
    "id" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "hit_count" INTEGER NOT NULL DEFAULT 1,
    "last_hit" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_stats" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "total_hits" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_stats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "analytics_endpoint_idx" ON "analytics"("endpoint");

-- CreateIndex
CREATE INDEX "analytics_last_hit_idx" ON "analytics"("last_hit");

-- CreateIndex
CREATE UNIQUE INDEX "analytics_endpoint_method_key" ON "analytics"("endpoint", "method");

-- CreateIndex
CREATE UNIQUE INDEX "daily_stats_date_key" ON "daily_stats"("date");

-- CreateIndex
CREATE INDEX "daily_stats_date_idx" ON "daily_stats"("date");
