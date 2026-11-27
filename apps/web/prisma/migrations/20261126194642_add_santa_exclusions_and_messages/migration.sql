-- AlterTable
ALTER TABLE "SecretSanta" ADD COLUMN     "exclusions" JSONB NOT NULL DEFAULT '[]';

-- CreateTable
CREATE TABLE "SecretSantaMessage" (
    "id" TEXT NOT NULL,
    "santaId" TEXT NOT NULL,
    "giverId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "fromGiver" BOOLEAN NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SecretSantaMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SecretSantaMessage_santaId_giverId_idx" ON "SecretSantaMessage"("santaId", "giverId");

-- CreateIndex
CREATE INDEX "SecretSantaMessage_santaId_recipientId_idx" ON "SecretSantaMessage"("santaId", "recipientId");

-- AddForeignKey
ALTER TABLE "SecretSantaMessage" ADD CONSTRAINT "SecretSantaMessage_santaId_fkey" FOREIGN KEY ("santaId") REFERENCES "SecretSanta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

