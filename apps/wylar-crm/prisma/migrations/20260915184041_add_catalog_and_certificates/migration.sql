-- CreateTable
CREATE TABLE "profiles" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "templateType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "sector" TEXT NOT NULL,
    "subsector" TEXT NOT NULL,
    "nivel" TEXT NOT NULL,
    "vigencia" TEXT,
    "target" TEXT[],
    "isChileValora" BOOLEAN NOT NULL DEFAULT false,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "heroHook" TEXT NOT NULL,
    "heroParagraphs" TEXT[],
    "heroCta" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profile_sections" (
    "id" SERIAL NOT NULL,
    "profileId" INTEGER NOT NULL,
    "key" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "title" TEXT,
    "text" TEXT,
    "intro" TEXT,
    "closing" TEXT,
    "note" TEXT,

    CONSTRAINT "profile_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profile_section_items" (
    "id" SERIAL NOT NULL,
    "sectionId" INTEGER NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "group" TEXT,
    "code" TEXT,
    "title" TEXT,
    "text" TEXT,

    CONSTRAINT "profile_section_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profile_faqs" (
    "id" SERIAL NOT NULL,
    "profileId" INTEGER NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,

    CONSTRAINT "profile_faqs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certificates" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "holderName" TEXT NOT NULL,
    "holderRut" TEXT NOT NULL,
    "profileId" INTEGER,
    "certificationTitle" TEXT NOT NULL,
    "categoryLabel" TEXT NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL,
    "expiryDate" TIMESTAMP(3),
    "leadId" INTEGER,
    "issuedById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "certificates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "profiles_slug_key" ON "profiles"("slug");

-- CreateIndex
CREATE INDEX "profiles_templateType_idx" ON "profiles"("templateType");

-- CreateIndex
CREATE INDEX "profiles_active_idx" ON "profiles"("active");

-- CreateIndex
CREATE UNIQUE INDEX "profile_sections_profileId_key_key" ON "profile_sections"("profileId", "key");

-- CreateIndex
CREATE INDEX "profile_section_items_sectionId_idx" ON "profile_section_items"("sectionId");

-- CreateIndex
CREATE INDEX "profile_faqs_profileId_idx" ON "profile_faqs"("profileId");

-- CreateIndex
CREATE UNIQUE INDEX "certificates_code_key" ON "certificates"("code");

-- CreateIndex
CREATE INDEX "certificates_holderRut_idx" ON "certificates"("holderRut");

-- AddForeignKey
ALTER TABLE "profile_sections" ADD CONSTRAINT "profile_sections_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_section_items" ADD CONSTRAINT "profile_section_items_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "profile_sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_faqs" ADD CONSTRAINT "profile_faqs_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_issuedById_fkey" FOREIGN KEY ("issuedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
