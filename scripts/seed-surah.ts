/**
 * Script for seeding Surah (Quran chapters) data from API https://equran.id/api/v2/surat/{id}
 * Fetches each surah individually by number (1-114) with rate limiting
 * Also seeds all ayat (verses) for each surah
 * Run with: bun run seed:surah
 */

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import "dotenv/config";
import { getJuzByVerse } from "../src/data/juz-mapping";

// Setup Prisma Client with PostgreSQL adapter
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// API Response types
interface SurahDetailResponse {
  code: number;
  message: string;
  data?: SurahData;
}

interface SurahData {
  nomor: number;
  nama: string;
  namaLatin: string;
  jumlahAyat: number;
  tempatTurun: string;
  arti: string;
  deskripsi: string;
  audioFull: Record<string, string>;
  ayat: AyatData[];
  suratSelanjutnya: boolean | SurahRef;
  suratSebelumnya: boolean | SurahRef;
}

interface SurahRef {
  nomor: number;
  nama: string;
  namaLatin: string;
  jumlahAyat: number;
}

interface AyatData {
  nomorAyat: number;
  teksArab: string;
  teksLatin: string;
  teksIndonesia: string;
  audio: Record<string, string>;
}

// Configuration
const CONFIG = {
  BASE_URL: "https://equran.id/api/v2/surat",
  START_NUMBER: 1,
  MAX_NUMBER: 114, // Total surahs in Quran
  DELAY_MS: 200, // Delay between requests (rate limiting) - slightly higher due to more data
  MAX_RETRIES: 3, // Max retries for failed requests
  RETRY_DELAY_MS: 1000, // Delay before retry
};

/**
 * Delay helper for rate limiting
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetch single surah by number with retry mechanism
 */
async function fetchSurahByNumber(
  number: number,
  retries = CONFIG.MAX_RETRIES
): Promise<SurahData | null> {
  try {
    const response = await fetch(`${CONFIG.BASE_URL}/${number}`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result: SurahDetailResponse | any = await response.json();

    // API returns error code when not found
    if (result.code !== 200 || !result.data) {
      return null;
    }

    return result.data;
  } catch (error) {
    // Retry on network errors
    if (retries > 0) {
      console.log(`  ⚠️  Retrying Surah ${number}... (${retries} attempts left)`);
      await delay(CONFIG.RETRY_DELAY_MS);
      return fetchSurahByNumber(number, retries - 1);
    }

    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    console.error(`  ❌ Failed to fetch Surah ${number}: ${errorMsg}`);
    return null;
  }
}

async function seedSurah(): Promise<void> {
  console.log("=".repeat(60));
  console.log("🌱 SEED SURAH & AYAT - Athar Backend");
  console.log("=".repeat(60) + "\n");

  console.log("📋 Configuration:");
  console.log(`   • API Base URL: ${CONFIG.BASE_URL}`);
  console.log(`   • Surah Range: ${CONFIG.START_NUMBER} - ${CONFIG.MAX_NUMBER}`);
  console.log(`   • Rate Limit: ${CONFIG.DELAY_MS}ms between requests`);
  console.log(`   • Max Retries: ${CONFIG.MAX_RETRIES}\n`);

  const startTime = Date.now();

  // Track results
  let surahSeededCount = 0;
  let surahSkippedCount = 0;
  let ayatSeededCount = 0;
  let ayatSkippedCount = 0;
  let notFoundCount = 0;
  const skippedItems: { name: string; reason: string }[] = [];

  console.log("📝 Starting seeding process...\n");

  try {
    // Loop through surah numbers sequentially
    for (let number = CONFIG.START_NUMBER; number <= CONFIG.MAX_NUMBER; number++) {
      // Rate limiting
      if (number > CONFIG.START_NUMBER) {
        await delay(CONFIG.DELAY_MS);
      }

      console.log(`\n📖 Processing Surah ${number}/${CONFIG.MAX_NUMBER}...`);

      // Fetch surah by number
      const surah = await fetchSurahByNumber(number);

      // Handle not found
      if (!surah) {
        notFoundCount++;
        console.log(`  ⚠️  Surah ${number} not found`);
        continue;
      }

      try {
        // Check duplication by surah number
        const existingSurah = await prisma.surah.findUnique({
          where: { number: surah.nomor },
        });

        if (existingSurah) {
          surahSkippedCount++;
          skippedItems.push({
            name: surah.namaLatin,
            reason: `Duplicate (Surah Number: ${surah.nomor})`,
          });
          console.log(`  ⏭️  Skipped: ${surah.namaLatin} (already exists)`);

          // Still seed new ayat even if surah exists
          await seedAyatForSurah(surah, existingSurah.number);
          continue;
        }

        // Insert new surah
        await prisma.surah.create({
          data: {
            number: surah.nomor,
            name: surah.nama,
            latinName: surah.namaLatin,
            verseCount: surah.jumlahAyat,
            revelationPlace: surah.tempatTurun,
            meaning: surah.arti,
            description: surah.deskripsi || "",
            audioFull: surah.audioFull || null,
          },
        });

        surahSeededCount++;
        console.log(`  ✅ Surah: ${surah.namaLatin} (${surah.jumlahAyat} verses)`);

        // Seed ayat for this surah
        const { seeded, skipped } = await seedAyatForSurah(surah, surah.nomor);
        ayatSeededCount += seeded;
        ayatSkippedCount += skipped;

      } catch (error) {
        surahSkippedCount++;
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        skippedItems.push({
          name: surah.namaLatin,
          reason: `Error: ${errorMessage}`,
        });
        console.error(`  ❌ Failed to insert "${surah.namaLatin}": ${errorMessage}`);
      }
    }

    // Summary
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    const totalSurahProcessed = surahSeededCount + surahSkippedCount + notFoundCount;

    console.log("\n" + "=".repeat(60));
    console.log("📊 SEEDING RESULTS");
    console.log("=".repeat(60));
    console.log("\n📖 SURAH:");
    console.log(`   ✅ Successfully seeded : ${surahSeededCount} surahs`);
    console.log(`   ⏭️  Skipped (duplicate): ${surahSkippedCount} surahs`);
    console.log(`   🔍 Not found          : ${notFoundCount}`);
    console.log(`   📁 Total processed    : ${totalSurahProcessed}`);
    console.log("\n📜 AYAT:");
    console.log(`   ✅ Successfully seeded : ${ayatSeededCount} verses`);
    console.log(`   ⏭️  Skipped (duplicate): ${ayatSkippedCount} verses`);
    console.log(`   📁 Total verses       : ${ayatSeededCount + ayatSkippedCount}`);
    console.log(`\n⏱️  Execution time       : ${duration} seconds`);

    // Display skipped data if any
    if (skippedItems.length > 0 && skippedItems.length <= 20) {
      console.log("\n📋 Skipped surahs:");
      skippedItems.forEach((item, index) => {
        console.log(`   ${index + 1}. "${item.name}" - ${item.reason}`);
      });
    } else if (skippedItems.length > 20) {
      console.log(
        `\n📋 Skipped surahs (${skippedItems.length} items, showing first 10):`
      );
      skippedItems.slice(0, 10).forEach((item, index) => {
        console.log(`   ${index + 1}. "${item.name}" - ${item.reason}`);
      });
      console.log(`   ... and ${skippedItems.length - 10} more`);
    }

    console.log("\n" + "=".repeat(60));
    console.log("🎉 Seeding completed!");
    console.log("=".repeat(60));
  } catch (error) {
    console.error("\n❌ SEEDING FAILED!");
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

/**
 * Seed ayat (verses) for a specific surah
 */
async function seedAyatForSurah(
  surah: SurahData,
  surahNumber: number
): Promise<{ seeded: number; skipped: number }> {
  let seeded = 0;
  let skipped = 0;

  if (!surah.ayat || surah.ayat.length === 0) {
    console.log(`     ⚠️  No ayat data for ${surah.namaLatin}`);
    return { seeded, skipped };
  }

  for (const ayat of surah.ayat) {
    try {
      // Check if verse already exists
      const existingVerse = await prisma.verse.findUnique({
        where: {
          surahNumber_number: {
            surahNumber: surahNumber,
            number: ayat.nomorAyat,
          },
        },
      });

      if (existingVerse) {
        skipped++;
        continue;
      }

      // Insert new verse
      await prisma.verse.create({
        data: {
          surahNumber: surahNumber,
          number: ayat.nomorAyat,
          juz: getJuzByVerse(surahNumber, ayat.nomorAyat),
          arabic: ayat.teksArab || "",
          latin: ayat.teksLatin || "",
          indonesian: ayat.teksIndonesia || "",
          audio: ayat.audio || null,
        },
      });

      seeded++;
    } catch (error) {
      skipped++;
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error(
        `     ❌ Failed to insert ayat ${ayat.nomorAyat}: ${errorMessage}`
      );
    }
  }

  if (seeded > 0) {
    console.log(`     📜 Ayat: ${seeded} seeded, ${skipped} skipped`);
  } else if (skipped > 0) {
    console.log(`     📜 Ayat: all ${skipped} already exist`);
  }

  return { seeded, skipped };
}

// Run the script
seedSurah();
