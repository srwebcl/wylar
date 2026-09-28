-- Certificados: RUT normalizado (indexado) y revocación en vez de borrado.
ALTER TABLE "certificates"
  ADD COLUMN "holderRutNorm" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "revokedAt" TIMESTAMP(3),
  ADD COLUMN "revokedByName" TEXT;

UPDATE "certificates" SET "holderRutNorm" = lower(regexp_replace("holderRut", '[.\-\s]', '', 'g'));

CREATE INDEX "certificates_holderRutNorm_idx" ON "certificates"("holderRutNorm");

-- Límite de peticiones.
CREATE TABLE "rate_limits" (
  "key" TEXT NOT NULL,
  "count" INTEGER NOT NULL DEFAULT 0,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "rate_limits_pkey" PRIMARY KEY ("key")
);
CREATE INDEX "rate_limits_expiresAt_idx" ON "rate_limits"("expiresAt");

-- Auditoría.
CREATE TABLE "audit_logs" (
  "id" SERIAL NOT NULL,
  "userId" INTEGER,
  "userName" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "entity" TEXT NOT NULL,
  "entityId" TEXT,
  "detail" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");
