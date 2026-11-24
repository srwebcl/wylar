-- CreateTable
CREATE TABLE "popups" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "image" TEXT NOT NULL,
    "imageWidth" INTEGER,
    "imageHeight" INTEGER,
    "linkType" TEXT NOT NULL DEFAULT 'NONE',
    "linkHref" TEXT,
    "showOnAllPages" BOOLEAN NOT NULL DEFAULT true,
    "pages" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "showOnProfilePages" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "popups_pkey" PRIMARY KEY ("id")
);
