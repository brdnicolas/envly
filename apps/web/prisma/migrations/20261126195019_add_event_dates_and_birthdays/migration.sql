-- AlterTable
ALTER TABLE "User" ADD COLUMN     "birthdayDay" INTEGER,
ADD COLUMN     "birthdayMonth" INTEGER;

-- AlterTable
ALTER TABLE "Collection" ADD COLUMN     "eventDate" TIMESTAMP(3);

