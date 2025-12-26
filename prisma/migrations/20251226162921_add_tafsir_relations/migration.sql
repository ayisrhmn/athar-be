-- AddForeignKey
ALTER TABLE "tafsirs" ADD CONSTRAINT "tafsirs_surah_number_fkey" FOREIGN KEY ("surah_number") REFERENCES "surahs"("number") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tafsirs" ADD CONSTRAINT "tafsirs_surah_number_verse_number_fkey" FOREIGN KEY ("surah_number", "verse_number") REFERENCES "verses"("surah_number", "number") ON DELETE RESTRICT ON UPDATE CASCADE;
