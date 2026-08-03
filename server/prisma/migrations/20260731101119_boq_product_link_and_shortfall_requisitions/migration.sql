-- AlterEnum
ALTER TYPE "RequisitionType" ADD VALUE 'Product';

-- AlterTable
ALTER TABLE "boq_items" ADD COLUMN     "productId" INTEGER;

-- AlterTable
ALTER TABLE "requisitions" ADD COLUMN     "productId" INTEGER,
ADD COLUMN     "quantity" DECIMAL(12,2);

-- AddForeignKey
ALTER TABLE "boq_items" ADD CONSTRAINT "boq_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requisitions" ADD CONSTRAINT "requisitions_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;
