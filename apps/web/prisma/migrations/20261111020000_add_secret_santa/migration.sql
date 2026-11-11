-- CreateEnum
CREATE TYPE "SecretSantaStatus" AS ENUM ('OPEN', 'DRAWN');

-- CreateEnum
CREATE TYPE "SecretSantaMemberStatus" AS ENUM ('INVITED', 'JOINED');

-- CreateTable
CREATE TABLE "SecretSanta" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "budget" INTEGER,
    "date" TIMESTAMP(3),
    "inviteCode" TEXT NOT NULL,
    "status" "SecretSantaStatus" NOT NULL DEFAULT 'OPEN',
    "organizerId" TEXT NOT NULL,
    "drawnAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SecretSanta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecretSantaMember" (
    "id" TEXT NOT NULL,
    "santaId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "SecretSantaMemberStatus" NOT NULL DEFAULT 'JOINED',
    "collectionId" TEXT,
    "giftToId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SecretSantaMember_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SecretSanta_inviteCode_key" ON "SecretSanta"("inviteCode");

-- CreateIndex
CREATE INDEX "SecretSantaMember_userId_idx" ON "SecretSantaMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "SecretSantaMember_santaId_userId_key" ON "SecretSantaMember"("santaId", "userId");

-- AddForeignKey
ALTER TABLE "SecretSanta" ADD CONSTRAINT "SecretSanta_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecretSantaMember" ADD CONSTRAINT "SecretSantaMember_santaId_fkey" FOREIGN KEY ("santaId") REFERENCES "SecretSanta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecretSantaMember" ADD CONSTRAINT "SecretSantaMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecretSantaMember" ADD CONSTRAINT "SecretSantaMember_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecretSantaMember" ADD CONSTRAINT "SecretSantaMember_giftToId_fkey" FOREIGN KEY ("giftToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

