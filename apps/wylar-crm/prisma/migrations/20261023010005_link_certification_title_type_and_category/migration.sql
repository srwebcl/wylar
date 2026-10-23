-- AlterTable
ALTER TABLE "certification_titles" ADD COLUMN     "categoryId" INTEGER,
ADD COLUMN     "typeId" INTEGER;

-- CreateIndex
CREATE INDEX "certification_titles_typeId_idx" ON "certification_titles"("typeId");

-- CreateIndex
CREATE INDEX "certification_titles_categoryId_idx" ON "certification_titles"("categoryId");

-- AddForeignKey
ALTER TABLE "certification_titles" ADD CONSTRAINT "certification_titles_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "certificate_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certification_titles" ADD CONSTRAINT "certification_titles_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "certificate_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
