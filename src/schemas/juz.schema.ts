import { z } from "zod";

// Path params for juz
export const juzParamsSchema = z.object({
  number: z.coerce.number().min(1).max(30),
});

// Path params for juz + surah
export const juzSurahParamsSchema = z.object({
  number: z.coerce.number().min(1).max(30),
  surahNumber: z.coerce.number().min(1).max(114),
});

// Types
export type JuzParams = z.infer<typeof juzParamsSchema>;
export type JuzSurahParams = z.infer<typeof juzSurahParamsSchema>;
