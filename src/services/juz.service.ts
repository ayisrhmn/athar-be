import type { PrismaClient } from "@prisma/client";
import { juzMapping } from "../data/juz-mapping";
import type { JuzSurahQuery } from "../schemas/juz.schema";

export class JuzService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Get all juz list (1-30) with surahs info
   */
  async findAll() {
    // Get verse count per juz from database
    const juzCounts = await this.prisma.verse.groupBy({
      by: ["juz"],
      _count: { id: true },
      orderBy: { juz: "asc" },
    });

    // Get surahs for each juz
    const surahsByJuz = await this.prisma.verse.groupBy({
      by: ["juz", "surahNumber"],
      orderBy: [{ juz: "asc" }, { surahNumber: "asc" }],
    });

    // Get all surah basic info
    const allSurahs = await this.prisma.surah.findMany({
      select: {
        number: true,
        name: true,
        latinName: true,
      },
      orderBy: { number: "asc" },
    });

    // Create surah lookup map
    const surahMap = new Map(allSurahs.map((s) => [s.number, s]));

    // Group surahs by juz
    const surahsGroupedByJuz = new Map<number, typeof allSurahs>();
    for (const item of surahsByJuz) {
      const existing = surahsGroupedByJuz.get(item.juz) ?? [];
      const surah = surahMap.get(item.surahNumber);
      if (surah && !existing.find((s) => s.number === surah.number)) {
        existing.push(surah);
      }
      surahsGroupedByJuz.set(item.juz, existing);
    }

    // Map juz data with count and surahs
    const data = juzMapping.map((juz) => {
      const countData = juzCounts.find((c) => c.juz === juz.juz);
      return {
        number: juz.juz,
        start: juz.start,
        end: juz.end,
        totalVerses: countData?._count.id ?? 0,
        surahs: surahsGroupedByJuz.get(juz.juz) ?? [],
      };
    });

    return data;
  }

  /**
   * Get juz detail by number with list of surahs and their verse range
   */
  async findByNumber(number: number) {
    const juzInfo = juzMapping.find((j) => j.juz === number);

    if (!juzInfo) {
      return null;
    }

    // Get verse range per surah in this juz
    const verseRanges = await this.prisma.verse.groupBy({
      by: ["surahNumber"],
      where: { juz: number },
      _min: { number: true },
      _max: { number: true },
      _count: { id: true },
      orderBy: { surahNumber: "asc" },
    });

    // Get surah info for surahs in this juz
    const surahNumbers = verseRanges.map((a) => a.surahNumber);
    const surahs = await this.prisma.surah.findMany({
      where: { number: { in: surahNumbers } },
      select: {
        number: true,
        name: true,
        latinName: true,
        verseCount: true,
        revelationPlace: true,
        meaning: true,
      },
      orderBy: { number: "asc" },
    });

    // Combine surah info with verse range
    const surahsWithRange = surahs.map((surah) => {
      const range = verseRanges.find((a) => a.surahNumber === surah.number);
      return {
        ...surah,
        versesInJuz: {
          start: range?._min.number ?? 1,
          end: range?._max.number ?? 1,
        },
        totalVersesInJuz: range?._count.id ?? 0,
      };
    });

    // Get total verse count in this juz
    const totalVerses = verseRanges.reduce((sum, r) => sum + r._count.id, 0);

    // Get prev and next juz
    const prevJuz = number > 1 ? juzMapping.find((j) => j.juz === number - 1) : null;
    const nextJuz = number < 30 ? juzMapping.find((j) => j.juz === number + 1) : null;

    return {
      number,
      start: juzInfo.start,
      end: juzInfo.end,
      totalVerses,
      surahs: surahsWithRange,
      prevInfo: prevJuz ? { number: prevJuz.juz } : null,
      nextInfo: nextJuz ? { number: nextJuz.juz } : null,
    };
  }

  /**
   * Get surah verses filtered by juz (with optional verse filter)
   */
  async findSurahByJuz(
    juzNumber: number,
    surahNumber: number,
    query: JuzSurahQuery
  ) {
    const juzInfo = juzMapping.find((j) => j.juz === juzNumber);

    if (!juzInfo) {
      return null;
    }

    // Get surah info
    const surah = await this.prisma.surah.findUnique({
      where: { number: surahNumber },
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

    // Build where clause
    const verseWhere: any = {
      surahNumber,
      juz: juzNumber,
    };

    // Apply verse filter
    if (query.fromVerse || query.toVerse) {
      verseWhere.number = {};
      if (query.fromVerse) {
        verseWhere.number.gte = query.fromVerse;
      }
      if (query.toVerse) {
        verseWhere.number.lte = query.toVerse;
      }
    }

    // Get verses only for this juz
    const verses = await this.prisma.verse.findMany({
      where: verseWhere,
      orderBy: { number: "asc" },
    });

    // If no verses found, this surah is not in this juz
    if (verses.length === 0) {
      return null;
    }

    // Get all surahs in this juz for navigation
    const surahsInJuz = await this.prisma.verse.groupBy({
      by: ["surahNumber"],
      where: { juz: juzNumber },
      orderBy: { surahNumber: "asc" },
    });
    const surahNumbers = surahsInJuz.map((s) => s.surahNumber);
    const currentIndex = surahNumbers.indexOf(surahNumber);

    // Determine prev surah
    let prevSurah = null;
    let prevJuz = juzNumber;
    
    if (currentIndex > 0) {
      // There's a previous surah in the same juz
      const prevSurahNumber = surahNumbers[currentIndex - 1];
      prevSurah = await this.prisma.surah.findUnique({
        where: { number: prevSurahNumber },
        select: { number: true, name: true, latinName: true },
      });
    } else if (juzNumber > 1) {
      // First surah in this juz, get last surah from previous juz
      prevJuz = juzNumber - 1;
      const prevJuzSurahs = await this.prisma.verse.groupBy({
        by: ["surahNumber"],
        where: { juz: prevJuz },
        orderBy: { surahNumber: "desc" },
      });
      if (prevJuzSurahs.length > 0 && prevJuzSurahs[0]) {
        prevSurah = await this.prisma.surah.findUnique({
          where: { number: prevJuzSurahs[0].surahNumber },
          select: { number: true, name: true, latinName: true },
        });
      }
    }

    // Determine next surah
    let nextSurah = null;
    let nextJuz = juzNumber;

    if (currentIndex < surahNumbers.length - 1) {
      // There's a next surah in the same juz
      const nextSurahNumber = surahNumbers[currentIndex + 1];
      nextSurah = await this.prisma.surah.findUnique({
        where: { number: nextSurahNumber },
        select: { number: true, name: true, latinName: true },
      });
    } else if (juzNumber < 30) {
      // Last surah in this juz, get first surah from next juz
      nextJuz = juzNumber + 1;
      const nextJuzSurahs = await this.prisma.verse.groupBy({
        by: ["surahNumber"],
        where: { juz: nextJuz },
        orderBy: { surahNumber: "asc" },
      });
      if (nextJuzSurahs.length > 0 && nextJuzSurahs[0]) {
        nextSurah = await this.prisma.surah.findUnique({
          where: { number: nextJuzSurahs[0].surahNumber },
          select: { number: true, name: true, latinName: true },
        });
      }
    }

    return {
      juz: juzNumber,
      surah,
      verses,
      prevInfo: prevSurah ? { juz: prevJuz, surah: prevSurah } : null,
      nextInfo: nextSurah ? { juz: nextJuz, surah: nextSurah } : null,
    };
  }

  /**
   * Get surah tafsir filtered by juz (with optional verse filter)
   */
  async findSurahTafsirByJuz(
    juzNumber: number,
    surahNumber: number,
    query: JuzSurahQuery
  ) {
    const juzInfo = juzMapping.find((j) => j.juz === juzNumber);

    if (!juzInfo) {
      return null;
    }

    // Get surah info
    const surah = await this.prisma.surah.findUnique({
      where: { number: surahNumber },
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

    // Build where clause for verses in juz
    const verseWhere: any = {
      surahNumber,
      juz: juzNumber,
    };

    // Apply verse filter
    if (query.fromVerse || query.toVerse) {
      verseWhere.number = {};
      if (query.fromVerse) {
        verseWhere.number.gte = query.fromVerse;
      }
      if (query.toVerse) {
        verseWhere.number.lte = query.toVerse;
      }
    }

    // Get verse numbers in this juz for this surah
    const versesInJuz = await this.prisma.verse.findMany({
      where: verseWhere,
      select: { number: true },
      orderBy: { number: "asc" },
    });

    // If no verses found, this surah is not in this juz
    if (versesInJuz.length === 0) {
      return null;
    }

    const verseNumbers = versesInJuz.map((a) => a.number);

    // Get tafsir only for verses in this juz
    const tafsir = await this.prisma.tafsir.findMany({
      where: {
        surahNumber,
        verseNumber: { in: verseNumbers },
      },
      orderBy: { verseNumber: "asc" },
    });

    // Get all surahs in this juz for navigation
    const surahsInJuz = await this.prisma.verse.groupBy({
      by: ["surahNumber"],
      where: { juz: juzNumber },
      orderBy: { surahNumber: "asc" },
    });
    const surahNumbersInJuz = surahsInJuz.map((s) => s.surahNumber);
    const currentIndex = surahNumbersInJuz.indexOf(surahNumber);

    // Determine prev surah
    let prevSurah = null;
    let prevJuz = juzNumber;
    
    if (currentIndex > 0) {
      // There's a previous surah in the same juz
      const prevSurahNumber = surahNumbersInJuz[currentIndex - 1];
      prevSurah = await this.prisma.surah.findUnique({
        where: { number: prevSurahNumber },
        select: { number: true, name: true, latinName: true },
      });
    } else if (juzNumber > 1) {
      // First surah in this juz, get last surah from previous juz
      prevJuz = juzNumber - 1;
      const prevJuzSurahs = await this.prisma.verse.groupBy({
        by: ["surahNumber"],
        where: { juz: prevJuz },
        orderBy: { surahNumber: "desc" },
      });
      if (prevJuzSurahs.length > 0 && prevJuzSurahs[0]) {
        prevSurah = await this.prisma.surah.findUnique({
          where: { number: prevJuzSurahs[0].surahNumber },
          select: { number: true, name: true, latinName: true },
        });
      }
    }

    // Determine next surah
    let nextSurah = null;
    let nextJuz = juzNumber;

    if (currentIndex < surahNumbersInJuz.length - 1) {
      // There's a next surah in the same juz
      const nextSurahNumber = surahNumbersInJuz[currentIndex + 1];
      nextSurah = await this.prisma.surah.findUnique({
        where: { number: nextSurahNumber },
        select: { number: true, name: true, latinName: true },
      });
    } else if (juzNumber < 30) {
      // Last surah in this juz, get first surah from next juz
      nextJuz = juzNumber + 1;
      const nextJuzSurahs = await this.prisma.verse.groupBy({
        by: ["surahNumber"],
        where: { juz: nextJuz },
        orderBy: { surahNumber: "asc" },
      });
      if (nextJuzSurahs.length > 0 && nextJuzSurahs[0]) {
        nextSurah = await this.prisma.surah.findUnique({
          where: { number: nextJuzSurahs[0].surahNumber },
          select: { number: true, name: true, latinName: true },
        });
      }
    }

    return {
      juz: juzNumber,
      surah,
      tafsir,
      prevInfo: prevSurah ? { juz: prevJuz, surah: prevSurah } : null,
      nextInfo: nextSurah ? { juz: nextJuz, surah: nextSurah } : null,
    };
  }
}
