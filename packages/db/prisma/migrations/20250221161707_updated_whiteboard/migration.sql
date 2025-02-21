/*
  Warnings:

  - Added the required column `canvasId` to the `Whiteboard` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Whiteboard" ADD COLUMN     "canvasId" TEXT NOT NULL;
