-- AlterTable
ALTER TABLE "issued_tools" ADD COLUMN     "collectorAckAt" TIMESTAMP(3),
ADD COLUMN     "collectorId" INTEGER,
ADD COLUMN     "isReturnable" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "storesAckAt" TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "issued_tools" ADD CONSTRAINT "issued_tools_collectorId_fkey" FOREIGN KEY ("collectorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
