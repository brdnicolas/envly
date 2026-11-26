-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'THANKS';

-- AlterTable
ALTER TABLE "Wish" ADD COLUMN     "receivedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Reservation" ADD COLUMN     "reserverId" TEXT,
ADD COLUMN     "thankedAt" TIMESTAMP(3),
ADD COLUMN     "thanks" TEXT;

-- CreateIndex
CREATE INDEX "Reservation_reserverId_idx" ON "Reservation"("reserverId");

