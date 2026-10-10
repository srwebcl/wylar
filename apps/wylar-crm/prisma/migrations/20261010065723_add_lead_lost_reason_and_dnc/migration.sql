-- AlterTable
ALTER TABLE "leads" ADD COLUMN     "lostReason" TEXT;

-- CreateTable
CREATE TABLE "do_not_contact_entries" (
    "id" SERIAL NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "reason" TEXT NOT NULL,
    "createdByName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "do_not_contact_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "do_not_contact_entries_email_idx" ON "do_not_contact_entries"("email");

-- CreateIndex
CREATE INDEX "do_not_contact_entries_phone_idx" ON "do_not_contact_entries"("phone");
