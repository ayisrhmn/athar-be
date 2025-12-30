-- CreateIndex
CREATE INDEX "tafsirs_surah_number_idx" ON "tafsirs"("surah_number");

-- CreateIndex
CREATE INDEX "verses_juz_idx" ON "verses"("juz");

-- CreateIndex
CREATE INDEX "verses_surah_number_juz_idx" ON "verses"("surah_number", "juz");
