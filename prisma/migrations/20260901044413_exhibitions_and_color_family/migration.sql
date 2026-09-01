-- CreateEnum
CREATE TYPE "ColorFamily" AS ENUM ('WARM', 'EARTH', 'GREEN', 'BLUE', 'NEUTRAL');

-- AlterTable
ALTER TABLE "Artwork" ADD COLUMN     "colorFamily" "ColorFamily";

-- CreateTable
CREATE TABLE "Exhibition" (
    "id" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "imageUrl" TEXT NOT NULL DEFAULT '',
    "pressUrl" TEXT NOT NULL DEFAULT '',
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Exhibition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExhibitionTranslation" (
    "id" TEXT NOT NULL,
    "exhibitionId" TEXT NOT NULL,
    "locale" "Locale" NOT NULL,
    "title" TEXT NOT NULL,
    "location" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "ExhibitionTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Exhibition_startDate_idx" ON "Exhibition"("startDate");

-- CreateIndex
CREATE UNIQUE INDEX "ExhibitionTranslation_exhibitionId_locale_key" ON "ExhibitionTranslation"("exhibitionId", "locale");

-- CreateIndex
CREATE INDEX "Artwork_colorFamily_idx" ON "Artwork"("colorFamily");

-- AddForeignKey
ALTER TABLE "ExhibitionTranslation" ADD CONSTRAINT "ExhibitionTranslation_exhibitionId_fkey" FOREIGN KEY ("exhibitionId") REFERENCES "Exhibition"("id") ON DELETE CASCADE ON UPDATE CASCADE;
