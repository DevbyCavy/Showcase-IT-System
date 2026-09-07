-- CreateEnum
CREATE TYPE "TakeoffDesignStatus" AS ENUM ('Pending', 'Processing', 'Ready', 'Failed');

-- CreateEnum
CREATE TYPE "TakeoffPdfType" AS ENUM ('Cad', 'Rendered', 'Mixed');

-- CreateEnum
CREATE TYPE "TakeoffItemCategory" AS ENUM ('Structure', 'Cladding', 'Electrical', 'Furniture', 'Other');

-- CreateEnum
CREATE TYPE "TakeoffItemSource" AS ENUM ('Extracted', 'Predicted', 'Inferred');

-- CreateEnum
CREATE TYPE "TakeoffItemConfidence" AS ENUM ('High', 'Medium', 'Low');

-- CreateTable
CREATE TABLE "takeoff_projects" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "clientName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "takeoff_projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "takeoff_designs" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "originalFilename" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "pdfType" "TakeoffPdfType",
    "status" "TakeoffDesignStatus" NOT NULL DEFAULT 'Pending',
    "failureReason" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "takeoff_designs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "takeoff_items" (
    "id" SERIAL NOT NULL,
    "designId" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "category" "TakeoffItemCategory" NOT NULL,
    "material" TEXT,
    "widthMm" DECIMAL(10,2),
    "heightMm" DECIMAL(10,2),
    "lengthMm" DECIMAL(10,2),
    "unit" TEXT NOT NULL,
    "quantity" DECIMAL(12,2) NOT NULL,
    "source" "TakeoffItemSource" NOT NULL,
    "confidence" "TakeoffItemConfidence" NOT NULL,
    "notes" TEXT,

    CONSTRAINT "takeoff_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "material_specs" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "standardSheetWmm" DECIMAL(10,2),
    "standardSheetHmm" DECIMAL(10,2),
    "typicalThicknessMm" DOUBLE PRECISION[],
    "standardLengthsMm" DOUBLE PRECISION[],
    "wasteFactor" DECIMAL(4,2) NOT NULL DEFAULT 1.10,
    "unitCost" DECIMAL(12,2),

    CONSTRAINT "material_specs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "material_specs_name_key" ON "material_specs"("name");

-- AddForeignKey
ALTER TABLE "takeoff_projects" ADD CONSTRAINT "takeoff_projects_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "takeoff_designs" ADD CONSTRAINT "takeoff_designs_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "takeoff_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "takeoff_items" ADD CONSTRAINT "takeoff_items_designId_fkey" FOREIGN KEY ("designId") REFERENCES "takeoff_designs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
