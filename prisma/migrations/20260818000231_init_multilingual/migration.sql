-- CreateEnum
CREATE TYPE "Locale" AS ENUM ('RU', 'EN', 'KO');

-- CreateEnum
CREATE TYPE "ArtworkStatus" AS ENUM ('AVAILABLE', 'RESERVED', 'SOLD');

-- CreateEnum
CREATE TYPE "Technique" AS ENUM ('OIL', 'ACRYLIC', 'MIXED');

-- CreateEnum
CREATE TYPE "Orientation" AS ENUM ('LANDSCAPE', 'PORTRAIT', 'SQUARE');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('NEW', 'CONTACTED', 'CONFIRMED', 'PAID', 'SHIPPED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "OrderItemVariant" AS ENUM ('ORIGINAL', 'PRINT');

-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('OWNER', 'EDITOR');

-- CreateTable
CREATE TABLE "AdminUser" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "AdminRole" NOT NULL DEFAULT 'EDITOR',
    "twoFactorSecret" TEXT,
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'info',
    "ipHash" TEXT NOT NULL DEFAULT '',
    "actor" TEXT NOT NULL DEFAULT '',
    "detail" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Collection" (
    "id" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "ogImage" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Collection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollectionTranslation" (
    "id" TEXT NOT NULL,
    "collectionId" TEXT NOT NULL,
    "locale" "Locale" NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "seoTitle" TEXT NOT NULL DEFAULT '',
    "seoDescription" TEXT NOT NULL DEFAULT '',
    "keywords" TEXT NOT NULL DEFAULT '',
    "hashtags" TEXT NOT NULL DEFAULT '',
    "canonicalUrl" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "CollectionTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Artwork" (
    "id" TEXT NOT NULL,
    "year" INTEGER,
    "technique" "Technique" NOT NULL DEFAULT 'OIL',
    "widthCm" DOUBLE PRECISION NOT NULL,
    "heightCm" DOUBLE PRECISION NOT NULL,
    "orientation" "Orientation" NOT NULL DEFAULT 'LANDSCAPE',
    "dominantColor" TEXT NOT NULL DEFAULT '',
    "status" "ArtworkStatus" NOT NULL DEFAULT 'AVAILABLE',
    "priceOriginalCents" INTEGER NOT NULL,
    "pricePrintCents" INTEGER,
    "currency" TEXT NOT NULL DEFAULT 'KRW',
    "collectionId" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "ogImage" TEXT NOT NULL DEFAULT '',
    "views" INTEGER NOT NULL DEFAULT 0,
    "buyClicks" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Artwork_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArtworkTranslation" (
    "id" TEXT NOT NULL,
    "artworkId" TEXT NOT NULL,
    "locale" "Locale" NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "story" TEXT NOT NULL DEFAULT '',
    "seoTitle" TEXT NOT NULL DEFAULT '',
    "seoDescription" TEXT NOT NULL DEFAULT '',
    "altText" TEXT NOT NULL DEFAULT '',
    "ogTitle" TEXT NOT NULL DEFAULT '',
    "ogDescription" TEXT NOT NULL DEFAULT '',
    "keywords" TEXT NOT NULL DEFAULT '',
    "hashtags" TEXT NOT NULL DEFAULT '',
    "canonicalUrl" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "ArtworkTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArtworkImage" (
    "id" TEXT NOT NULL,
    "artworkId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArtworkImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlogPost" (
    "id" TEXT NOT NULL,
    "coverImage" TEXT NOT NULL DEFAULT '',
    "published" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BlogPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlogPostTranslation" (
    "id" TEXT NOT NULL,
    "blogPostId" TEXT NOT NULL,
    "locale" "Locale" NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL DEFAULT '',
    "contentHtml" TEXT NOT NULL DEFAULT '',
    "seoTitle" TEXT NOT NULL DEFAULT '',
    "seoDescription" TEXT NOT NULL DEFAULT '',
    "keywords" TEXT NOT NULL DEFAULT '',
    "hashtags" TEXT NOT NULL DEFAULT '',
    "canonicalUrl" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "BlogPostTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteKeywords" (
    "locale" "Locale" NOT NULL,
    "keywords" TEXT NOT NULL DEFAULT '',
    "hashtags" TEXT NOT NULL DEFAULT '',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteKeywords_pkey" PRIMARY KEY ("locale")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "customerNameEnc" TEXT NOT NULL,
    "emailEnc" TEXT NOT NULL,
    "phoneEnc" TEXT NOT NULL DEFAULT '',
    "addressEnc" TEXT NOT NULL DEFAULT '',
    "messageEnc" TEXT NOT NULL DEFAULT '',
    "emailHash" TEXT NOT NULL DEFAULT '',
    "ipHash" TEXT NOT NULL DEFAULT '',
    "riskScore" INTEGER NOT NULL DEFAULT 0,
    "riskFlags" TEXT NOT NULL DEFAULT '',
    "status" "OrderStatus" NOT NULL DEFAULT 'NEW',
    "totalCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'KRW',
    "locale" "Locale" NOT NULL DEFAULT 'RU',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "artworkId" TEXT,
    "titleSnapshot" TEXT NOT NULL,
    "variant" "OrderItemVariant" NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPriceCents" INTEGER NOT NULL,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactMessage" (
    "id" TEXT NOT NULL,
    "nameEnc" TEXT NOT NULL,
    "emailEnc" TEXT NOT NULL,
    "messageEnc" TEXT NOT NULL,
    "emailHash" TEXT NOT NULL DEFAULT '',
    "ipHash" TEXT NOT NULL DEFAULT '',
    "locale" "Locale" NOT NULL DEFAULT 'RU',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContactMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email");

-- CreateIndex
CREATE INDEX "AuditLog_event_createdAt_idx" ON "AuditLog"("event", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_severity_createdAt_idx" ON "AuditLog"("severity", "createdAt");

-- CreateIndex
CREATE INDEX "Collection_position_idx" ON "Collection"("position");

-- CreateIndex
CREATE UNIQUE INDEX "CollectionTranslation_collectionId_locale_key" ON "CollectionTranslation"("collectionId", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "CollectionTranslation_locale_slug_key" ON "CollectionTranslation"("locale", "slug");

-- CreateIndex
CREATE INDEX "Artwork_published_position_idx" ON "Artwork"("published", "position");

-- CreateIndex
CREATE INDEX "Artwork_collectionId_idx" ON "Artwork"("collectionId");

-- CreateIndex
CREATE INDEX "Artwork_status_idx" ON "Artwork"("status");

-- CreateIndex
CREATE INDEX "Artwork_technique_idx" ON "Artwork"("technique");

-- CreateIndex
CREATE UNIQUE INDEX "ArtworkTranslation_artworkId_locale_key" ON "ArtworkTranslation"("artworkId", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "ArtworkTranslation_locale_slug_key" ON "ArtworkTranslation"("locale", "slug");

-- CreateIndex
CREATE INDEX "ArtworkImage_artworkId_idx" ON "ArtworkImage"("artworkId");

-- CreateIndex
CREATE INDEX "BlogPost_published_publishedAt_idx" ON "BlogPost"("published", "publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "BlogPostTranslation_blogPostId_locale_key" ON "BlogPostTranslation"("blogPostId", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "BlogPostTranslation_locale_slug_key" ON "BlogPostTranslation"("locale", "slug");

-- CreateIndex
CREATE INDEX "Order_status_createdAt_idx" ON "Order"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Order_emailHash_idx" ON "Order"("emailHash");

-- CreateIndex
CREATE INDEX "Order_ipHash_createdAt_idx" ON "Order"("ipHash", "createdAt");

-- CreateIndex
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");

-- CreateIndex
CREATE INDEX "ContactMessage_createdAt_idx" ON "ContactMessage"("createdAt");

-- AddForeignKey
ALTER TABLE "CollectionTranslation" ADD CONSTRAINT "CollectionTranslation_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Artwork" ADD CONSTRAINT "Artwork_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArtworkTranslation" ADD CONSTRAINT "ArtworkTranslation_artworkId_fkey" FOREIGN KEY ("artworkId") REFERENCES "Artwork"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArtworkImage" ADD CONSTRAINT "ArtworkImage_artworkId_fkey" FOREIGN KEY ("artworkId") REFERENCES "Artwork"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogPostTranslation" ADD CONSTRAINT "BlogPostTranslation_blogPostId_fkey" FOREIGN KEY ("blogPostId") REFERENCES "BlogPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_artworkId_fkey" FOREIGN KEY ("artworkId") REFERENCES "Artwork"("id") ON DELETE SET NULL ON UPDATE CASCADE;
