-- AlterTable
ALTER TABLE "user" ADD COLUMN     "statutPro" "StatutPro" NOT NULL DEFAULT 'AUCUN';

-- CreateIndex
CREATE INDEX "user_role_statutPro_idx" ON "user"("role", "statutPro");
