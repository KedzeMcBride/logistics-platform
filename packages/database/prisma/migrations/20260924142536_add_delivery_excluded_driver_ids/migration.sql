-- AlterTable
ALTER TABLE "Delivery" ADD COLUMN     "excludedDriverIds" JSONB NOT NULL DEFAULT '[]';
