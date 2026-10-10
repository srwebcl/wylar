-- CreateTable
CREATE TABLE "certificate_categories" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "certificate_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certificate_types" (
    "id" SERIAL NOT NULL,
    "label" TEXT NOT NULL,
    "completionText" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "certificate_types_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "certificate_categories_name_key" ON "certificate_categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "certificate_types_label_key" ON "certificate_types"("label");
