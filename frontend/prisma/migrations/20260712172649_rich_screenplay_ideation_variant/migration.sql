/*
  Warnings:

  - You are about to drop the column `characterArchetypes` on the `Variant` table. All the data in the column will be lost.
  - You are about to drop the column `threeActOutline` on the `Variant` table. All the data in the column will be lost.
  - Added the required column `constraintValidation` to the `Variant` table without a default value. This is not possible if the table is not empty.
  - Added the required column `emotionalCore` to the `Variant` table without a default value. This is not possible if the table is not empty.
  - Added the required column `genre` to the `Variant` table without a default value. This is not possible if the table is not empty.
  - Added the required column `highConcept` to the `Variant` table without a default value. This is not possible if the table is not empty.
  - Added the required column `mainCharacters` to the `Variant` table without a default value. This is not possible if the table is not empty.
  - Added the required column `productionConsiderations` to the `Variant` table without a default value. This is not possible if the table is not empty.
  - Added the required column `targetAudience` to the `Variant` table without a default value. This is not possible if the table is not empty.
  - Added the required column `theme` to the `Variant` table without a default value. This is not possible if the table is not empty.
  - Added the required column `threeActStructure` to the `Variant` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tone` to the `Variant` table without a default value. This is not possible if the table is not empty.
  - Added the required column `uniquenessNote` to the `Variant` table without a default value. This is not possible if the table is not empty.
  - Added the required column `visualStyle` to the `Variant` table without a default value. This is not possible if the table is not empty.
  - Added the required column `workingTitle` to the `Variant` table without a default value. This is not possible if the table is not empty.
  - Added the required column `worldBuilding` to the `Variant` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Variant" DROP COLUMN "characterArchetypes",
DROP COLUMN "threeActOutline",
ADD COLUMN     "characterRelationships" TEXT[],
ADD COLUMN     "cinematicReferences" TEXT[],
ADD COLUMN     "constraintValidation" JSONB NOT NULL,
ADD COLUMN     "emotionalCore" TEXT NOT NULL,
ADD COLUMN     "genre" TEXT NOT NULL,
ADD COLUMN     "highConcept" TEXT NOT NULL,
ADD COLUMN     "mainCharacters" JSONB NOT NULL,
ADD COLUMN     "majorPlotTwists" TEXT[],
ADD COLUMN     "productionConsiderations" JSONB NOT NULL,
ADD COLUMN     "screenplayExcerpt" TEXT,
ADD COLUMN     "targetAudience" TEXT NOT NULL,
ADD COLUMN     "theme" TEXT NOT NULL,
ADD COLUMN     "threeActStructure" JSONB NOT NULL,
ADD COLUMN     "tone" TEXT NOT NULL,
ADD COLUMN     "uniquenessNote" TEXT NOT NULL,
ADD COLUMN     "visualStyle" TEXT NOT NULL,
ADD COLUMN     "workingTitle" TEXT NOT NULL,
ADD COLUMN     "worldBuilding" TEXT NOT NULL;
