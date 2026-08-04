-- AlterTable
ALTER TABLE "quotations" ADD COLUMN     "applyVat" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "vatAmount" DECIMAL(12,2) NOT NULL DEFAULT 0;
