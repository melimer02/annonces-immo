-- CreateEnum
CREATE TYPE "StatutPro" AS ENUM ('AUCUN', 'EN_ATTENTE', 'VALIDE', 'REFUSE');

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "statutPro" "StatutPro" NOT NULL DEFAULT 'AUCUN';
