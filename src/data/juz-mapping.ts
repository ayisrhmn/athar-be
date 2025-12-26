/**
 * Data mapping for 30 Juz of Al-Quran
 * Juz is the division of Al-Quran into 30 equal parts
 *
 * Format:
 * - juz: Juz number (1-30)
 * - start: Starting surah and verse of the juz
 * - end: Ending surah and verse of the juz
 */

export interface JuzRange {
  juz: number;
  start: { surah: number; verse: number };
  end: { surah: number; verse: number };
}

export const juzMapping: JuzRange[] = [
  // Juz 1: Al-Fatihah 1 - Al-Baqarah 141
  { juz: 1, start: { surah: 1, verse: 1 }, end: { surah: 2, verse: 141 } },

  // Juz 2: Al-Baqarah 142 - Al-Baqarah 252
  { juz: 2, start: { surah: 2, verse: 142 }, end: { surah: 2, verse: 252 } },

  // Juz 3: Al-Baqarah 253 - Ali Imran 92
  { juz: 3, start: { surah: 2, verse: 253 }, end: { surah: 3, verse: 92 } },

  // Juz 4: Ali Imran 93 - An-Nisa 23
  { juz: 4, start: { surah: 3, verse: 93 }, end: { surah: 4, verse: 23 } },

  // Juz 5: An-Nisa 24 - An-Nisa 147
  { juz: 5, start: { surah: 4, verse: 24 }, end: { surah: 4, verse: 147 } },

  // Juz 6: An-Nisa 148 - Al-Ma'idah 81
  { juz: 6, start: { surah: 4, verse: 148 }, end: { surah: 5, verse: 81 } },

  // Juz 7: Al-Ma'idah 82 - Al-An'am 110
  { juz: 7, start: { surah: 5, verse: 82 }, end: { surah: 6, verse: 110 } },

  // Juz 8: Al-An'am 111 - Al-A'raf 87
  { juz: 8, start: { surah: 6, verse: 111 }, end: { surah: 7, verse: 87 } },

  // Juz 9: Al-A'raf 88 - Al-Anfal 40
  { juz: 9, start: { surah: 7, verse: 88 }, end: { surah: 8, verse: 40 } },

  // Juz 10: Al-Anfal 41 - At-Tawbah 92
  { juz: 10, start: { surah: 8, verse: 41 }, end: { surah: 9, verse: 92 } },

  // Juz 11: At-Tawbah 93 - Hud 5
  { juz: 11, start: { surah: 9, verse: 93 }, end: { surah: 11, verse: 5 } },

  // Juz 12: Hud 6 - Yusuf 52
  { juz: 12, start: { surah: 11, verse: 6 }, end: { surah: 12, verse: 52 } },

  // Juz 13: Yusuf 53 - Ibrahim 52
  { juz: 13, start: { surah: 12, verse: 53 }, end: { surah: 14, verse: 52 } },

  // Juz 14: Al-Hijr 1 - An-Nahl 128
  { juz: 14, start: { surah: 15, verse: 1 }, end: { surah: 16, verse: 128 } },

  // Juz 15: Al-Isra 1 - Al-Kahf 74
  { juz: 15, start: { surah: 17, verse: 1 }, end: { surah: 18, verse: 74 } },

  // Juz 16: Al-Kahf 75 - Taha 135
  { juz: 16, start: { surah: 18, verse: 75 }, end: { surah: 20, verse: 135 } },

  // Juz 17: Al-Anbiya 1 - Al-Hajj 78
  { juz: 17, start: { surah: 21, verse: 1 }, end: { surah: 22, verse: 78 } },

  // Juz 18: Al-Mu'minun 1 - Al-Furqan 20
  { juz: 18, start: { surah: 23, verse: 1 }, end: { surah: 25, verse: 20 } },

  // Juz 19: Al-Furqan 21 - An-Naml 55
  { juz: 19, start: { surah: 25, verse: 21 }, end: { surah: 27, verse: 55 } },

  // Juz 20: An-Naml 56 - Al-Ankabut 45
  { juz: 20, start: { surah: 27, verse: 56 }, end: { surah: 29, verse: 45 } },

  // Juz 21: Al-Ankabut 46 - Al-Ahzab 30
  { juz: 21, start: { surah: 29, verse: 46 }, end: { surah: 33, verse: 30 } },

  // Juz 22: Al-Ahzab 31 - Ya-Sin 27
  { juz: 22, start: { surah: 33, verse: 31 }, end: { surah: 36, verse: 27 } },

  // Juz 23: Ya-Sin 28 - Az-Zumar 31
  { juz: 23, start: { surah: 36, verse: 28 }, end: { surah: 39, verse: 31 } },

  // Juz 24: Az-Zumar 32 - Fussilat 46
  { juz: 24, start: { surah: 39, verse: 32 }, end: { surah: 41, verse: 46 } },

  // Juz 25: Fussilat 47 - Al-Jathiyah 37
  { juz: 25, start: { surah: 41, verse: 47 }, end: { surah: 45, verse: 37 } },

  // Juz 26: Al-Ahqaf 1 - Adh-Dhariyat 30
  { juz: 26, start: { surah: 46, verse: 1 }, end: { surah: 51, verse: 30 } },

  // Juz 27: Adh-Dhariyat 31 - Al-Hadid 29
  { juz: 27, start: { surah: 51, verse: 31 }, end: { surah: 57, verse: 29 } },

  // Juz 28: Al-Mujadila 1 - At-Tahrim 12
  { juz: 28, start: { surah: 58, verse: 1 }, end: { surah: 66, verse: 12 } },

  // Juz 29: Al-Mulk 1 - Al-Mursalat 50
  { juz: 29, start: { surah: 67, verse: 1 }, end: { surah: 77, verse: 50 } },

  // Juz 30 (Juz Amma): An-Naba 1 - An-Nas 6
  { juz: 30, start: { surah: 78, verse: 1 }, end: { surah: 114, verse: 6 } },
];

/**
 * Get juz number based on surah and verse number
 * @param surahNumber - Surah number (1-114)
 * @param verseNumber - Verse number
 * @returns Juz number (1-30)
 */
export function getJuzByVerse(surahNumber: number, verseNumber: number): number {
  for (const juzData of juzMapping) {
    const { juz, start, end } = juzData;

    // Check if verse is within this juz range
    const isAfterStart =
      surahNumber > start.surah ||
      (surahNumber === start.surah && verseNumber >= start.verse);

    const isBeforeEnd =
      surahNumber < end.surah ||
      (surahNumber === end.surah && verseNumber <= end.verse);

    if (isAfterStart && isBeforeEnd) {
      return juz;
    }
  }

  // Default to juz 1 if not found (should never happen)
  return 1;
}

/**
 * Get list of juz numbers covered by a surah
 * @param surahNumber - Surah number (1-114)
 * @param totalVerses - Total verses in the surah
 * @returns Array of juz numbers covered by the surah
 */
export function getJuzListBySurah(
  surahNumber: number,
  totalVerses: number
): number[] {
  const juzSet = new Set<number>();

  // Check first and last verse
  juzSet.add(getJuzByVerse(surahNumber, 1));
  juzSet.add(getJuzByVerse(surahNumber, totalVerses));

  // If different, check all juz in between
  const firstJuz = getJuzByVerse(surahNumber, 1);
  const lastJuz = getJuzByVerse(surahNumber, totalVerses);

  for (let j = firstJuz; j <= lastJuz; j++) {
    juzSet.add(j);
  }

  return Array.from(juzSet).sort((a, b) => a - b);
}

/**
 * Get complete juz information
 * @param juzNumber - Juz number (1-30)
 * @returns Juz info or undefined if invalid
 */
export function getJuzInfo(juzNumber: number): JuzRange | undefined {
  return juzMapping.find((j) => j.juz === juzNumber);
}
