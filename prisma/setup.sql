CREATE EXTENSION IF NOT EXISTS vector;

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "MealStatus" AS ENUM ('PENDING', 'CONFIRMED', 'REJECTED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "MealType" AS ENUM ('BREAKFAST', 'LUNCH', 'DINNER', 'SNACK', 'OTHER');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "HealthProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "displayName" TEXT NOT NULL DEFAULT '林同学',
    "goal" TEXT NOT NULL DEFAULT '温和减脂',
    "dietaryNotes" TEXT NOT NULL DEFAULT '',
    "data" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HealthProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "MealRecord" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "eatenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "title" TEXT NOT NULL,
    "items" JSONB NOT NULL,
    "estimatedKcal" INTEGER,
    "lowerKcal" INTEGER,
    "upperKcal" INTEGER,
    "proteinG" DOUBLE PRECISION,
    "carbsG" DOUBLE PRECISION,
    "fatG" DOUBLE PRECISION,
    "notes" TEXT NOT NULL DEFAULT '',
    "status" "MealStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MealRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "PlanVersion" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "plan" JSONB NOT NULL,
    "activeAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlanVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Feedback" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "rating" INTEGER,
    "note" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "KnowledgeChunk" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "embedding" vector(1024),
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KnowledgeChunk_pkey" PRIMARY KEY ("id")
);

-- Idempotent upgrades for databases created before these columns existed
ALTER TABLE "HealthProfile" ADD COLUMN IF NOT EXISTS "userId" TEXT;
ALTER TABLE "HealthProfile" ADD COLUMN IF NOT EXISTS "data" JSONB;
ALTER TABLE "MealRecord" ADD COLUMN IF NOT EXISTS "proteinG" DOUBLE PRECISION;
ALTER TABLE "MealRecord" ADD COLUMN IF NOT EXISTS "carbsG" DOUBLE PRECISION;
ALTER TABLE "MealRecord" ADD COLUMN IF NOT EXISTS "fatG" DOUBLE PRECISION;
ALTER TABLE "PlanVersion" ADD COLUMN IF NOT EXISTS "activeAt" TIMESTAMP(3);

-- Existing plans were effective before activation existed; keep the latest one
-- active only when the profile has never recorded an active version.
UPDATE "PlanVersion" pv
SET "activeAt" = pv."createdAt"
WHERE pv."activeAt" IS NULL
  AND pv."version" = (
    SELECT MAX(v."version") FROM "PlanVersion" v WHERE v."profileId" = pv."profileId"
  )
  AND NOT EXISTS (
    SELECT 1 FROM "PlanVersion" active
    WHERE active."profileId" = pv."profileId" AND active."activeAt" IS NOT NULL
  );

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "HealthProfile_userId_key" ON "HealthProfile"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "MealRecord_profileId_eatenAt_idx" ON "MealRecord"("profileId", "eatenAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "MealRecord_status_createdAt_idx" ON "MealRecord"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "PlanVersion_profileId_version_key" ON "PlanVersion"("profileId", "version");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PlanVersion_profileId_activeAt_idx" ON "PlanVersion"("profileId", "activeAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Feedback_profileId_createdAt_idx" ON "Feedback"("profileId", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "KnowledgeChunk_source_idx" ON "KnowledgeChunk"("source");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "HealthProfile" ADD CONSTRAINT "HealthProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "MealRecord" ADD CONSTRAINT "MealRecord_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "HealthProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "PlanVersion" ADD CONSTRAINT "PlanVersion_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "HealthProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "HealthProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Vector ANN index for RAG
CREATE INDEX IF NOT EXISTS "KnowledgeChunk_embedding_idx" ON "KnowledgeChunk" USING hnsw ("embedding" vector_cosine_ops);
