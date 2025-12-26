/**
 * Script for seeding doa (prayer) data from API https://equran.id/api/doa/{id}
 * Fetches each doa individually by ID with rate limiting
 * Run with: bun run seed:doa
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
interface DoaDetailResponse {
  status: "success" | "error";
  message?: string;
  data?: DoaData;
}

interface DoaData {
  id: number;
  grup: string;
  nama: string;
  ar: string;
  tr: string;
  idn: string;
  tentang: string;
  tag: string[];
}

// Configuration
const CONFIG = {
  BASE_URL: "https://equran.id/api/doa",
  START_ID: 1,
  MAX_ID: 227, // Upper limit to prevent infinite loop
  DELAY_MS: 100, // Delay between requests (rate limiting)
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
 * Fetch single doa by ID with retry mechanism
 */
async function fetchDoaById(
  id: number,
  retries = CONFIG.MAX_RETRIES
): Promise<DoaData | null> {
  try {
    const response = await fetch(`${CONFIG.BASE_URL}/${id}`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result: DoaDetailResponse | any = await response.json();

    // API returns error status when ID not found
    if (result.status === "error" || !result.data) {
      return null;
    }

    return result.data;
  } catch (error) {
    // Retry on network errors
    if (retries > 0) {
      console.log(`  ⚠️  Retrying ID ${id}... (${retries} attempts left)`);
      await delay(CONFIG.RETRY_DELAY_MS);
      return fetchDoaById(id, retries - 1);
    }

    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    console.error(`  ❌ Failed to fetch ID ${id}: ${errorMsg}`);
    return null;
  }
}

async function seedDoa(): Promise<void> {
  console.log("=".repeat(50));
  console.log("🌱 SEED DOA - Athar Backend");
  console.log("=".repeat(50) + "\n");

  console.log("📋 Configuration:");
  console.log(`   • API Base URL: ${CONFIG.BASE_URL}`);
  console.log(`   • ID Range: ${CONFIG.START_ID} - ${CONFIG.MAX_ID}`);
  console.log(`   • Rate Limit: ${CONFIG.DELAY_MS}ms between requests`);
  console.log(`   • Max Retries: ${CONFIG.MAX_RETRIES}\n`);

  const startTime = Date.now();

  // Track results
  let seededCount = 0;
  let skippedCount = 0;
  let notFoundCount = 0;
  let consecutiveNotFound = 0;
  const skippedItems: { name: string; reason: string }[] = [];

  console.log("📝 Starting seeding process...\n");

  try {
    // Loop through IDs sequentially
    for (let id = CONFIG.START_ID; id <= CONFIG.MAX_ID; id++) {
      // Rate limiting
      if (id > CONFIG.START_ID) {
        await delay(CONFIG.DELAY_MS);
      }

      // Fetch doa by ID
      const doa = await fetchDoaById(id);

      // Handle not found - stop if too many consecutive not found
      if (!doa) {
        notFoundCount++;
        consecutiveNotFound++;

        // Stop if 10 consecutive IDs not found (reached end of data)
        if (consecutiveNotFound >= 10) {
          console.log(
            `\n⏹️  Stopping: ${consecutiveNotFound} consecutive IDs not found (reached end of data)`
          );
          break;
        }
        continue;
      }

      // Reset consecutive counter when found
      consecutiveNotFound = 0;

      try {
        // Check duplication by apiId
        const existingByApiId = await prisma.doa.findUnique({
          where: { apiId: doa.id },
        });

        if (existingByApiId) {
          skippedCount++;
          skippedItems.push({
            name: doa.nama,
            reason: `Duplicate (API ID: ${doa.id})`,
          });
          continue;
        }

        // Check duplication by name + description
        const existingByContent = await prisma.doa.findFirst({
          where: {
            name: doa.nama,
            description: doa.tentang || "",
          },
        });

        if (existingByContent) {
          skippedCount++;
          skippedItems.push({
            name: doa.nama,
            reason: "Duplicate (same name + description)",
          });
          continue;
        }

        // Insert new data
        await prisma.doa.create({
          data: {
            apiId: doa.id,
            group: doa.grup || "",
            name: doa.nama || "",
            arabic: doa.ar || "",
            latin: doa.tr || "",
            meaning: doa.idn || "",
            description: doa.tentang || "",
            tags: doa.tag || [],
          },
        });

        seededCount++;
        console.log(`  ✅ [${seededCount}] ID:${id} - ${doa.nama}`);
      } catch (error) {
        skippedCount++;
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        skippedItems.push({
          name: doa.nama,
          reason: `Error: ${errorMessage}`,
        });
        console.error(`  ❌ Failed to insert "${doa.nama}": ${errorMessage}`);
      }
    }

    // Summary
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    const totalProcessed = seededCount + skippedCount + notFoundCount;

    console.log("\n" + "=".repeat(50));
    console.log("📊 SEEDING RESULTS");
    console.log("=".repeat(50));
    console.log(`✅ Successfully seeded : ${seededCount} records`);
    console.log(`⏭️  Skipped (duplicate): ${skippedCount} records`);
    console.log(`🔍 IDs not found      : ${notFoundCount}`);
    console.log(`📁 Total IDs checked  : ${totalProcessed}`);
    console.log(`⏱️  Execution time    : ${duration} seconds`);

    // Display skipped data if any
    if (skippedItems.length > 0 && skippedItems.length <= 20) {
      console.log("\n📋 Skipped data:");
      skippedItems.forEach((item, index) => {
        console.log(`   ${index + 1}. "${item.name}" - ${item.reason}`);
      });
    } else if (skippedItems.length > 20) {
      console.log(
        `\n📋 Skipped data (${skippedItems.length} items, showing first 10):`
      );
      skippedItems.slice(0, 10).forEach((item, index) => {
        console.log(`   ${index + 1}. "${item.name}" - ${item.reason}`);
      });
      console.log(`   ... and ${skippedItems.length - 10} more`);
    }

    console.log("\n" + "=".repeat(50));
    console.log("🎉 Seeding completed!");
    console.log("=".repeat(50));
  } catch (error) {
    console.error("\n❌ SEEDING FAILED!");
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

// Run the script
seedDoa();
