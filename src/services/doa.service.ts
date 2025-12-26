import type { PrismaClient } from "@prisma/client";
import type { DoaQuery, PaginationMeta } from "../schemas/doa.schema";

export class DoaService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Get all doa with pagination and optional filtering
   */
  async findAll(query: DoaQuery) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    // Build where clause for filtering
    const where: any = {};

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: "insensitive" } },
        { meaning: { contains: query.search, mode: "insensitive" } },
        { latin: { contains: query.search, mode: "insensitive" } },
      ];
    }

    if (query.group) {
      where.group = query.group;
    }

    // Get total count for pagination
    const totalItems = await this.prisma.doa.count({ where });
    const totalPages = Math.ceil(totalItems / limit);

    // Get data with pagination
    const data = await this.prisma.doa.findMany({
      where,
      orderBy: { apiId: "asc" },
      skip,
      take: limit,
    });

    // Build pagination meta
    const meta: PaginationMeta = {
      currentPage: page,
      totalPages,
      totalItems,
      itemsPerPage: limit,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };

    return { data, meta };
  }

  /**
   * Get single doa by API ID with navigation info
   */
  async findByApiId(apiId: number) {
    const doa = await this.prisma.doa.findUnique({
      where: { apiId },
    });

    if (!doa) {
      return null;
    }

    // Get prev and next doa
    const prevDoa = await this.prisma.doa.findFirst({
      where: { apiId: { lt: apiId } },
      orderBy: { apiId: "desc" },
      select: { apiId: true, name: true },
    });

    const nextDoa = await this.prisma.doa.findFirst({
      where: { apiId: { gt: apiId } },
      orderBy: { apiId: "asc" },
      select: { apiId: true, name: true },
    });

    return {
      ...doa,
      prevInfo: prevDoa
        ? { apiId: prevDoa.apiId, name: prevDoa.name }
        : null,
      nextInfo: nextDoa
        ? { apiId: nextDoa.apiId, name: nextDoa.name }
        : null,
    };
  }

  /**
   * Get all unique groups for filtering
   */
  async getGroups() {
    const groups = await this.prisma.doa.findMany({
      select: { group: true },
      distinct: ["group"],
      orderBy: { group: "asc" },
    });

    return groups.map((g) => g.group);
  }
}
