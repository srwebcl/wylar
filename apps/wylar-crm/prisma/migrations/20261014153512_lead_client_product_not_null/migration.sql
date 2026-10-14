/*
  Warnings:

  - Made the column `clientId` on table `leads` required. This step will fail if there are existing NULL values in that column.
  - Made the column `productId` on table `leads` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "leads" DROP CONSTRAINT "leads_clientId_fkey";

-- DropForeignKey
ALTER TABLE "leads" DROP CONSTRAINT "leads_productId_fkey";

-- AlterTable
ALTER TABLE "leads" ALTER COLUMN "clientId" SET NOT NULL,
ALTER COLUMN "productId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
