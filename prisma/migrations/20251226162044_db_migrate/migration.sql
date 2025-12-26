-- CreateTable
CREATE TABLE "doas" (
    "id" TEXT NOT NULL,
    "api_id" INTEGER NOT NULL,
    "group" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "arabic" TEXT NOT NULL,
    "latin" TEXT NOT NULL,
    "meaning" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "tags" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "doas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "surahs" (
    "id" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "latin_name" TEXT NOT NULL,
    "verse_count" INTEGER NOT NULL,
    "revelation_place" TEXT NOT NULL,
    "meaning" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "audio_full" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "surahs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verses" (
    "id" TEXT NOT NULL,
    "surah_number" INTEGER NOT NULL,
    "number" INTEGER NOT NULL,
    "juz" INTEGER NOT NULL,
    "arabic" TEXT NOT NULL,
    "latin" TEXT NOT NULL,
    "indonesian" TEXT NOT NULL,
    "audio" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tafsirs" (
    "id" TEXT NOT NULL,
    "surah_number" INTEGER NOT NULL,
    "verse_number" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tafsirs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "doas_api_id_key" ON "doas"("api_id");

-- CreateIndex
CREATE UNIQUE INDEX "doas_name_description_key" ON "doas"("name", "description");

-- CreateIndex
CREATE UNIQUE INDEX "surahs_number_key" ON "surahs"("number");

-- CreateIndex
CREATE UNIQUE INDEX "verses_surah_number_number_key" ON "verses"("surah_number", "number");

-- CreateIndex
CREATE UNIQUE INDEX "tafsirs_surah_number_verse_number_key" ON "tafsirs"("surah_number", "verse_number");

-- AddForeignKey
ALTER TABLE "verses" ADD CONSTRAINT "verses_surah_number_fkey" FOREIGN KEY ("surah_number") REFERENCES "surahs"("number") ON DELETE RESTRICT ON UPDATE CASCADE;
