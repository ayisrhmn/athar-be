import type { PrismaClient } from "@prisma/client";

export class AnalyticsService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Track endpoint hit (async, non-blocking)
   */
  async trackHit(endpoint: string, method: string): Promise<void> {
    try {
      // Upsert: increment if exists, create if not
      await this.prisma.analytics.upsert({
        where: {
          endpoint_method: {
            endpoint,
            method,
          },
        },
        update: {
          hitCount: {
            increment: 1,
          },
        },
        create: {
          endpoint,
          method,
          hitCount: 1,
        },
      });

      // Update daily stats
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset to start of day

      await this.prisma.dailyStats.upsert({
        where: {
          date: today,
        },
        update: {
          totalHits: {
            increment: 1,
          },
        },
        create: {
          date: today,
          totalHits: 1,
        },
      });
    } catch (error) {
      // Silent fail - analytics shouldn't break the app
      console.error("Analytics tracking error:", error);
    }
  }

  /**
   * Get most popular endpoints
   */
  async getPopularEndpoints(limit = 10) {
    return this.prisma.analytics.findMany({
      take: limit,
      orderBy: {
        hitCount: "desc",
      },
      select: {
        endpoint: true,
        method: true,
        hitCount: true,
        lastHit: true,
      },
    });
  }

  /**
   * Get daily stats for last N days
   */
  async getDailyStats(days = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    return this.prisma.dailyStats.findMany({
      where: {
        date: {
          gte: startDate,
        },
      },
      orderBy: {
        date: "desc",
      },
      select: {
        date: true,
        totalHits: true,
      },
    });
  }

  /**
   * Get total hits across all endpoints
   */
  async getTotalHits() {
    const result = await this.prisma.analytics.aggregate({
      _sum: {
        hitCount: true,
      },
    });

    return result._sum.hitCount || 0;
  }

  /**
   * Get analytics summary
   */
  async getSummary() {
    const [totalHits, popularEndpoints, recentStats] = await Promise.all([
      this.getTotalHits(),
      this.getPopularEndpoints(5),
      this.getDailyStats(7),
    ]);

    return {
      totalHits,
      popularEndpoints,
      last7Days: recentStats,
    };
  }

  /**
   * Get content popularity (most accessed surahs, juz, doa)
   */
  async getContentPopularity() {
    const allEndpoints = await this.prisma.analytics.findMany({
      select: {
        endpoint: true,
        hitCount: true,
      },
      orderBy: {
        hitCount: "desc",
      },
    });

    // Parse endpoints to extract content type and ID
    const surahs: Record<number, number> = {};
    const juz: Record<number, number> = {};
    const doa: Record<number, number> = {};

    for (const item of allEndpoints) {
      // Match patterns like /api/v1/surah/1, /api/v1/juz/2, /api/v1/doa/3
      const surahMatch = item.endpoint.match(/\/surah\/(\d+)/);
      const juzMatch = item.endpoint.match(/\/juz\/(\d+)/);
      const doaMatch = item.endpoint.match(/\/doa\/(\d+)/);

      if (surahMatch && surahMatch[1]) {
        const id = parseInt(surahMatch[1]);
        surahs[id] = (surahs[id] || 0) + item.hitCount;
      }
      if (juzMatch && juzMatch[1]) {
        const id = parseInt(juzMatch[1]);
        juz[id] = (juz[id] || 0) + item.hitCount;
      }
      if (doaMatch && doaMatch[1]) {
        const id = parseInt(doaMatch[1]);
        doa[id] = (doa[id] || 0) + item.hitCount;
      }
    }

    // Convert to sorted arrays
    const topSurahs = Object.entries(surahs)
      .map(([id, hits]) => ({ surahNumber: parseInt(id), hits }))
      .sort((a, b) => b.hits - a.hits)
      .slice(0, 10);

    const topJuz = Object.entries(juz)
      .map(([id, hits]) => ({ juzNumber: parseInt(id), hits }))
      .sort((a, b) => b.hits - a.hits)
      .slice(0, 10);

    const topDoa = Object.entries(doa)
      .map(([id, hits]) => ({ doaApiId: parseInt(id), hits }))
      .sort((a, b) => b.hits - a.hits)
      .slice(0, 10);

    return {
      topSurahs,
      topJuz,
      topDoa,
    };
  }
}
