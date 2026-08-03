-- CreateEnum
CREATE TYPE "BoqItemStatus" AS ENUM ('Pending', 'Fulfilled');

-- AlterTable
ALTER TABLE "boq_items" ADD COLUMN     "status" "BoqItemStatus" NOT NULL DEFAULT 'Fulfilled';

-- AlterTable
ALTER TABLE "requisitions" ADD COLUMN     "boqItemId" INTEGER;

-- AddForeignKey
ALTER TABLE "requisitions" ADD CONSTRAINT "requisitions_boqItemId_fkey" FOREIGN KEY ("boqItemId") REFERENCES "boq_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
