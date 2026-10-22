-- CreateTable
CREATE TABLE IF NOT EXISTS "lead_sources" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lead_sources_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "lead_sources_name_key" ON "lead_sources"("name");

-- Seed initial default sources
INSERT INTO "lead_sources" ("name") VALUES
    ('Web'),
    ('Instagram'),
    ('Facebook'),
    ('Google Ads'),
    ('Referidos')
ON CONFLICT ("name") DO NOTHING;
