-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Wish" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "url" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "price" REAL,
    "isPriority" BOOLEAN NOT NULL DEFAULT false,
    "collectionId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Wish_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Wish" ("collectionId", "createdAt", "description", "id", "imageUrl", "price", "title", "updatedAt", "url") SELECT "collectionId", "createdAt", "description", "id", "imageUrl", "price", "title", "updatedAt", "url" FROM "Wish";
DROP TABLE "Wish";
ALTER TABLE "new_Wish" RENAME TO "Wish";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
