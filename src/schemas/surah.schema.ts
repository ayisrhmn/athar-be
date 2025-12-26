import { z } from "zod";

// Base Surah schema (matches Prisma model)
export const surahSchema = z.object({
  id: z.string().uuid(),
  number: z.number(),
  name: z.string(),
  latinName: z.string(),
  verseCount: z.number(),
  revelationPlace: z.string(),
  meaning: z.string(),
  description: z.string(),
  audioFull: z.any().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Verse schema
export const verseSchema = z.object({
  id: z.string().uuid(),
  surahNumber: z.number(),
  number: z.number(),
  juz: z.number(),
  arabic: z.string(),
  latin: z.string(),
  indonesian: z.string(),
  audio: z.any().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Tafsir schema
export const tafsirSchema = z.object({
  id: z.string().uuid(),
  surahNumber: z.number(),
  verseNumber: z.number(),
  text: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Query params for list endpoint (with search)
export const surahQuerySchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(114).optional().default(114),
  search: z.string().optional(),
});

// Path params for single surah
export const surahParamsSchema = z.object({
  number: z.coerce.number().min(1).max(114),
});

// Query params for surah detail (verse filter)
export const surahDetailQuerySchema = z.object({
  fromVerse: z.coerce.number().min(1).optional(),
  toVerse: z.coerce.number().optional(),
});

// Types
export type Surah = z.infer<typeof surahSchema>;
export type Verse = z.infer<typeof verseSchema>;
export type Tafsir = z.infer<typeof tafsirSchema>;
export type SurahQuery = z.infer<typeof surahQuerySchema>;
export type SurahParams = z.infer<typeof surahParamsSchema>;
export type SurahDetailQuery = z.infer<typeof surahDetailQuerySchema>;
