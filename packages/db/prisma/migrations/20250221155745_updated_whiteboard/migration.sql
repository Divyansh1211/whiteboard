/*
  Warnings:

  - Added the required column `thumbnail` to the `Whiteboard` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `Whiteboard` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Whiteboard" ADD COLUMN     "lastModified" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "thumbnail" TEXT NOT NULL,
ADD COLUMN     "title" TEXT NOT NULL;
