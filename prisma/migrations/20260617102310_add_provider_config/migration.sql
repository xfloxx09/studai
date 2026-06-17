/*
  Warnings:

  - You are about to drop the `PublishingConnection` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "PublishingConnection";

-- CreateTable
CREATE TABLE "ProviderConfig" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "note" TEXT,
    "cost" TEXT,
    "connected" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "apiKey" TEXT,
    "credentials" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProviderConfig_pkey" PRIMARY KEY ("id")
);
