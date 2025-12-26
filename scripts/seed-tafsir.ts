/**
 * Script for seeding Tafsir (Quran interpretation) data from API https://equran.id/api/v2/tafsir/{id}
 * Fetches tafsir for each surah individually by number (1-114) with rate limiting
 * Run with: bun run seed:tafsir
 */

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import "dotenv/config";

// Setup Prisma Client with PostgreSQL adapter
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// API Response types
interface TafsirDetailResponse {
  code: number;
  message: string;
  data?: TafsirSurahData;
}

interface TafsirSurahData {
  nomor: number;
  nama: string;
  namaLatin: string;
  jumlahAyat: number;
  tempatTurun: string;
  arti: string;
  deskripsi: string;
  audioFull: Record<string, string>;
  tafsir: TafsirAyatData[];
  suratSelanjutnya: boolean | SurahRef;
  suratSebelumnya: boolean | SurahRef;
}

interface SurahRef {
  nomor: number;
  nama: string;
  namaLatin: string;
  jumlahAyat: number;
}

interface TafsirAyatData {
  ayat: number;
  teks: string;
}

// Configuration
const CONFIG = {
  BASE_URL: "https://equran.id/api/v2/tafsir",
  START_NUMBER: 1,
  MAX_NUMBER: 114, // Total surahs in Quran
  DELAY_MS: 200, // Delay between requests (rate limiting)
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
 * Fetch tafsir for a surah by number with retry mechanism
 */
async function fetchTafsirByNumber(
  number: number,
  retries = CONFIG.MAX_RETRIES
): Promise<TafsirSurahData | null> {
  try {
    const response = await fetch(`${CONFIG.BASE_URL}/${number}`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result: TafsirDetailResponse | any = await response.json();

    // API returns error code when not found
    if (result.code !== 200 || !result.data) {
      return null;
    }

    return result.data;
  } catch (error) {
    // Retry on network errors
    if (retries > 0) {
      console.log(
        `  ⚠️  Retrying Tafsir Surah ${number}... (${retries} attempts left)`
      );
      await delay(CONFIG.RETRY_DELAY_MS);
      return fetchTafsirByNumber(number, retries - 1);
    }

    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    console.error(`  ❌ Failed to fetch Tafsir Surah ${number}: ${errorMsg}`);
    return null;
  }
}

async function seedTafsir(): Promise<void> {
  console.log("=".repeat(60));
  console.log("🌱 SEED TAFSIR - Athar Backend");
  console.log("=".repeat(60) + "\n");

  console.log("📋 Configuration:");
  console.log(`   • API Base URL: ${CONFIG.BASE_URL}`);
  console.log(`   • Surah Range: ${CONFIG.START_NUMBER} - ${CONFIG.MAX_NUMBER}`);
  console.log(`   • Rate Limit: ${CONFIG.DELAY_MS}ms between requests`);
  console.log(`   • Max Retries: ${CONFIG.MAX_RETRIES}\n`);

  const startTime = Date.now();

  // Track results
  let surahProcessedCount = 0;
  let tafsirSeededCount = 0;
  let tafsirSkippedCount = 0;
  let notFoundCount = 0;
  const errorItems: { surah: string; reason: string }[] = [];

  console.log("📝 Starting seeding process...\n");

  try {
    // Loop through surah numbers sequentially
    for (
      let number = CONFIG.START_NUMBER;
      number <= CONFIG.MAX_NUMBER;
      number++
    ) {
      // Rate limiting
      if (number > CONFIG.START_NUMBER) {
        await delay(CONFIG.DELAY_MS);
      }

      console.log(`\n📖 Processing Tafsir Surah ${number}/${CONFIG.MAX_NUMBER}...`);

      // Fetch tafsir by surah number
      const tafsirData = await fetchTafsirByNumber(number);

      // Handle not found
      if (!tafsirData) {
        notFoundCount++;
        console.log(`  ⚠️  Tafsir for Surah ${number} not found`);
        continue;
      }

      surahProcessedCount++;
      console.log(`  📜 ${tafsirData.namaLatin} (${tafsirData.jumlahAyat} verses)`);

      // Seed tafsir for each ayat
      const { seeded, skipped } = await seedTafsirForSurah(
        tafsirData,
        tafsirData.nomor
      );
      tafsirSeededCount += seeded;
      tafsirSkippedCount += skipped;

      if (seeded === 0 && skipped === 0) {
        errorItems.push({
          surah: tafsirData.namaLatin,
          reason: "No tafsir data available",
        });
      }
    }

    // Summary
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log("\n" + "=".repeat(60));
    console.log("📊 SEEDING RESULTS");
    console.log("=".repeat(60));
    console.log("\n📖 SURAH PROCESSED:");
    console.log(`   ✅ Successfully processed: ${surahProcessedCount} surahs`);
    console.log(`   🔍 Not found            : ${notFoundCount}`);
    console.log("\n📜 TAFSIR:");
    console.log(`   ✅ Successfully seeded : ${tafsirSeededCount} tafsir entries`);
    console.log(`   ⏭️  Skipped (duplicate): ${tafsirSkippedCount} entries`);
    console.log(`   📁 Total entries       : ${tafsirSeededCount + tafsirSkippedCount}`);
    console.log(`\n⏱️  Execution time        : ${duration} seconds`);

    // Display errors if any
    if (errorItems.length > 0 && errorItems.length <= 20) {
      console.log("\n⚠️  Issues encountered:");
      errorItems.forEach((item, index) => {
        console.log(`   ${index + 1}. "${item.surah}" - ${item.reason}`);
      });
    } else if (errorItems.length > 20) {
      console.log(`\n⚠️  Issues (${errorItems.length} items, showing first 10):`);
      errorItems.slice(0, 10).forEach((item, index) => {
        console.log(`   ${index + 1}. "${item.surah}" - ${item.reason}`);
      });
      console.log(`   ... and ${errorItems.length - 10} more`);
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
 * Seed tafsir entries for a specific surah
 */
async function seedTafsirForSurah(
  data: TafsirSurahData,
  surahNumber: number
): Promise<{ seeded: number; skipped: number }> {
  let seeded = 0;
  let skipped = 0;

  if (!data.tafsir || data.tafsir.length === 0) {
    console.log(`     ⚠️  No tafsir data for ${data.namaLatin}`);
    return { seeded, skipped };
  }

  for (const tafsir of data.tafsir) {
    try {
      // Check if tafsir already exists
      const existingTafsir = await prisma.tafsir.findUnique({
        where: {
          surahNumber_verseNumber: {
            surahNumber: surahNumber,
            verseNumber: tafsir.ayat,
          },
        },
      });

      if (existingTafsir) {
        skipped++;
        continue;
      }

      // Insert new tafsir
      await prisma.tafsir.create({
        data: {
          surahNumber: surahNumber,
          verseNumber: tafsir.ayat,
          text: tafsir.teks || "",
        },
      });

      seeded++;
    } catch (error) {
      skipped++;
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error(
        `     ❌ Failed to insert tafsir ayat ${tafsir.ayat}: ${errorMessage}`
      );
    }
  }

  if (seeded > 0) {
    console.log(`     📝 Tafsir: ${seeded} seeded, ${skipped} skipped`);
  } else if (skipped > 0) {
    console.log(`     📝 Tafsir: all ${skipped} already exist`);
  }

  return { seeded, skipped };
}

// Run the script
seedTafsir();
