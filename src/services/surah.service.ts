import type { PrismaClient } from "@prisma/client";
import type { SurahQuery, SurahDetailQuery } from "../schemas/surah.schema";

export class SurahService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Get all surah with optional pagination and search
   */
  async findAll(query: SurahQuery) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 114;
    const skip = (page - 1) * limit;

    // Build where clause for search
    const where: any = {};
    if (query.search) {
      where.OR = [
        { latinName: { contains: query.search, mode: "insensitive" } },
        { meaning: { contains: query.search, mode: "insensitive" } },
      ];
    }

    // Get total count
    const totalItems = await this.prisma.surah.count({ where });
    const totalPages = Math.ceil(totalItems / limit);

    // Get data with pagination
    const data = await this.prisma.surah.findMany({
      where,
      orderBy: { number: "asc" },
      skip,
      take: limit,
      select: {
        id: true,
        number: true,
        name: true,
        latinName: true,
        verseCount: true,
        revelationPlace: true,
        meaning: true,
        // Exclude description and audioFull for list view
      },
    });

    // Get juz list for each surah from DB
    const surahNumbers = data.map((s) => s.number);
    const juzData = await this.prisma.verse.groupBy({
      by: ["surahNumber", "juz"],
      where: { surahNumber: { in: surahNumbers } },
      orderBy: [{ surahNumber: "asc" }, { juz: "asc" }],
    });

    // Group juz by surah
    const juzBySurah = new Map<number, number[]>();
    for (const item of juzData) {
      const existing = juzBySurah.get(item.surahNumber) ?? [];
      existing.push(item.juz);
      juzBySurah.set(item.surahNumber, existing);
    }

    // Add juz info to each surah
    const dataWithJuz = data.map((surah) => ({
      ...surah,
      juz: juzBySurah.get(surah.number) ?? [],
    }));

    const meta = {
      currentPage: page,
      totalPages,
      totalItems,
      itemsPerPage: limit,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };

    return { data: dataWithJuz, meta };
  }

  /**
   * Get single surah by number with verses (optional filter)
   */
  async findByNumber(number: number, query: SurahDetailQuery) {
    const surah = await this.prisma.surah.findUnique({
      where: { number },
    });

    if (!surah) {
      return null;
    }

    // Build where clause for verse filter
    const verseWhere: any = { surahNumber: number };

    if (query.fromVerse || query.toVerse) {
      verseWhere.number = {};
      if (query.fromVerse) {
        verseWhere.number.gte = query.fromVerse;
      }
      if (query.toVerse) {
        verseWhere.number.lte = query.toVerse;
      }
    }

    const verses = await this.prisma.verse.findMany({
      where: verseWhere,
      orderBy: { number: "asc" },
    });

    // Get prev and next surah
    const prevSurah =
      number > 1
        ? await this.prisma.surah.findUnique({
            where: { number: number - 1 },
            select: { number: true, name: true, latinName: true },
          })
        : null;

    const nextSurah =
      number < 114
        ? await this.prisma.surah.findUnique({
            where: { number: number + 1 },
            select: { number: true, name: true, latinName: true },
          })
        : null;

    return {
      ...surah,
      verses,
      prevInfo: prevSurah,
      nextInfo: nextSurah,
    };
  }

  /**
   * Get surah with tafsir by surah number (optional verse filter)
   */
  async findTafsirByNumber(number: number, query: SurahDetailQuery) {
    // Get surah info first
    const surah = await this.prisma.surah.findUnique({
      where: { number },
      select: {
        id: true,
        number: true,
        name: true,
        latinName: true,
        verseCount: true,
        revelationPlace: true,
        meaning: true,
        description: true,
      },
    });

    if (!surah) {
      return null;
    }

    // Build where clause for verse filter
    const tafsirWhere: any = { surahNumber: number };

    if (query.fromVerse || query.toVerse) {
      tafsirWhere.verseNumber = {};
      if (query.fromVerse) {
        tafsirWhere.verseNumber.gte = query.fromVerse;
      }
      if (query.toVerse) {
        tafsirWhere.verseNumber.lte = query.toVerse;
      }
    }

    // Get tafsir for this surah
    const tafsir = await this.prisma.tafsir.findMany({
      where: tafsirWhere,
      orderBy: { verseNumber: "asc" },
    });

    // Get prev and next surah
    const prevSurah =
      number > 1
        ? await this.prisma.surah.findUnique({
            where: { number: number - 1 },
            select: { number: true, name: true, latinName: true },
          })
        : null;

    const nextSurah =
      number < 114
        ? await this.prisma.surah.findUnique({
            where: { number: number + 1 },
            select: { number: true, name: true, latinName: true },
          })
        : null;

    return {
      ...surah,
      tafsir,
      prevInfo: prevSurah,
      nextInfo: nextSurah,
    };
  }
}
