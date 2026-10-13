-- AlterTable
ALTER TABLE "leads" ADD COLUMN     "rut" TEXT,
ADD COLUMN     "rutNorm" TEXT DEFAULT '';

-- CreateIndex
CREATE INDEX "leads_rutNorm_idx" ON "leads"("rutNorm");
