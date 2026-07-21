-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('Super Admin', 'Stores Admin', 'Project Manager', 'Accountant', 'Graphic Designer', 'Production Team', 'Logistics');

-- CreateEnum
CREATE TYPE "RecordStatus" AS ENUM ('Active', 'Deleted');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('New', 'Assigned', 'On Going', 'Completed');

-- CreateEnum
CREATE TYPE "RequisitionType" AS ENUM ('Food', 'Transport', 'Tool', 'Other');

-- CreateEnum
CREATE TYPE "RequisitionStatus" AS ENUM ('Pending', 'Processed', 'Approved', 'Rejected');

-- CreateEnum
CREATE TYPE "FuelType" AS ENUM ('Petrol', 'Diesel', 'Hybrid', 'Electric');

-- CreateEnum
CREATE TYPE "VehicleStatus" AS ENUM ('Available', 'On Trip', 'Under Maintenance', 'Out of Service');

-- CreateEnum
CREATE TYPE "VehicleDocumentType" AS ENUM ('Vehicle License', 'Insurance', 'Fitness Certificate', 'Radio License', 'Other');

-- CreateEnum
CREATE TYPE "VehicleDocumentStatus" AS ENUM ('Valid', 'Expiring Soon', 'Expired');

-- CreateEnum
CREATE TYPE "MaintenanceType" AS ENUM ('Service', 'Oil Change', 'Tyre Replacement', 'Brake Repair', 'Engine Repair', 'Accident Repair', 'Other');

-- CreateEnum
CREATE TYPE "TripStatus" AS ENUM ('Active', 'Completed');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "surname" TEXT NOT NULL,
    "userType" "Role" NOT NULL,
    "department" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brands" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "status" "RecordStatus" NOT NULL DEFAULT 'Active',

    CONSTRAINT "brands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "status" "RecordStatus" NOT NULL DEFAULT 'Active',

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "brandId" INTEGER NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "rate" DECIMAL(12,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "status" "RecordStatus" NOT NULL DEFAULT 'Active',

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "issued_tools" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "dateOfCollection" DATE NOT NULL,
    "collectorName" TEXT NOT NULL,
    "toolName" TEXT NOT NULL,
    "quantityIssued" INTEGER NOT NULL,
    "jobName" TEXT,
    "dateOfReturn" DATE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "issued_tools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" SERIAL NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "orderName" TEXT NOT NULL,
    "description" TEXT,
    "startDatetime" TIMESTAMP(3),
    "location" TEXT NOT NULL,
    "deadlineDatetime" TIMESTAMP(3),
    "boqFile" TEXT,
    "artworkFile" TEXT,
    "status" "OrderStatus" NOT NULL DEFAULT 'New',
    "ongoingSince" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "quantity" DECIMAL(12,2) NOT NULL,
    "rate" DECIMAL(12,2) NOT NULL,
    "total" DECIMAL(12,2) NOT NULL,
    "itemStatus" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_assignments" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "order_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "boqs" (
    "id" SERIAL NOT NULL,
    "boqNumber" TEXT NOT NULL,
    "orderId" INTEGER NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "eventName" TEXT NOT NULL,
    "clientName" TEXT,
    "location" TEXT NOT NULL,
    "createdById" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "boqs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "boq_items" (
    "id" SERIAL NOT NULL,
    "boqId" INTEGER NOT NULL,
    "productName" TEXT NOT NULL,
    "description" TEXT,
    "unit" TEXT,
    "quantity" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "boq_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "requisitions" (
    "id" SERIAL NOT NULL,
    "reqNumber" TEXT NOT NULL,
    "projectManager" TEXT NOT NULL,
    "eventName" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "eventDate" DATE NOT NULL,
    "teamMembers" TEXT,
    "reqType" "RequisitionType" NOT NULL,
    "reqTypeOther" TEXT,
    "submittedById" INTEGER NOT NULL,
    "status" "RequisitionStatus" NOT NULL DEFAULT 'Pending',
    "processedById" INTEGER,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "requisitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicles" (
    "id" SERIAL NOT NULL,
    "registrationNumber" TEXT NOT NULL,
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "vehicleYear" INTEGER NOT NULL,
    "color" TEXT NOT NULL,
    "fuelType" "FuelType" NOT NULL,
    "capacity" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "assignedUserId" INTEGER,
    "status" "VehicleStatus" NOT NULL DEFAULT 'Available',
    "purchaseDate" DATE NOT NULL,
    "notes" TEXT,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_documents" (
    "id" SERIAL NOT NULL,
    "vehicleId" INTEGER NOT NULL,
    "documentType" "VehicleDocumentType" NOT NULL,
    "documentNumber" TEXT NOT NULL,
    "issueDate" DATE NOT NULL,
    "expiryDate" DATE NOT NULL,
    "reminderDays" INTEGER NOT NULL,
    "status" "VehicleDocumentStatus" NOT NULL,
    "uploadedFile" TEXT,
    "notes" TEXT,

    CONSTRAINT "vehicle_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_logs" (
    "id" SERIAL NOT NULL,
    "vehicleId" INTEGER NOT NULL,
    "maintenanceType" "MaintenanceType" NOT NULL,
    "serviceProvider" TEXT,
    "serviceDate" DATE NOT NULL,
    "odometerReading" DECIMAL(12,2),
    "serviceCost" DECIMAL(12,2),
    "nextServiceDate" DATE,
    "nextServiceOdometer" DECIMAL(12,2),
    "notes" TEXT,

    CONSTRAINT "maintenance_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fuel_logs" (
    "id" SERIAL NOT NULL,
    "vehicleId" INTEGER NOT NULL,
    "fuelDate" DATE NOT NULL,
    "odometerReading" DECIMAL(12,2) NOT NULL,
    "litres" DECIMAL(10,2) NOT NULL,
    "fuelCost" DECIMAL(12,2) NOT NULL,
    "fuelStation" TEXT,
    "receiptNumber" TEXT,
    "notes" TEXT,

    CONSTRAINT "fuel_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_trips" (
    "id" SERIAL NOT NULL,
    "vehicleId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "destination" TEXT NOT NULL,
    "purpose" TEXT,
    "departureDatetime" TIMESTAMP(3) NOT NULL,
    "returnDatetime" TIMESTAMP(3),
    "odometerStart" DECIMAL(12,2) NOT NULL,
    "odometerEnd" DECIMAL(12,2),
    "distanceTravelled" DECIMAL(12,2),
    "remarks" TEXT,
    "tripStatus" "TripStatus" NOT NULL DEFAULT 'Active',

    CONSTRAINT "vehicle_trips_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "orders_orderNumber_key" ON "orders"("orderNumber");

-- CreateIndex
CREATE UNIQUE INDEX "boqs_boqNumber_key" ON "boqs"("boqNumber");

-- CreateIndex
CREATE UNIQUE INDEX "requisitions_reqNumber_key" ON "requisitions"("reqNumber");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_registrationNumber_key" ON "vehicles"("registrationNumber");

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "brands"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "issued_tools" ADD CONSTRAINT "issued_tools_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_assignments" ADD CONSTRAINT "order_assignments_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_assignments" ADD CONSTRAINT "order_assignments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boqs" ADD CONSTRAINT "boqs_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boqs" ADD CONSTRAINT "boqs_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boq_items" ADD CONSTRAINT "boq_items_boqId_fkey" FOREIGN KEY ("boqId") REFERENCES "boqs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requisitions" ADD CONSTRAINT "requisitions_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requisitions" ADD CONSTRAINT "requisitions_processedById_fkey" FOREIGN KEY ("processedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_assignedUserId_fkey" FOREIGN KEY ("assignedUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_documents" ADD CONSTRAINT "vehicle_documents_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_logs" ADD CONSTRAINT "maintenance_logs_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fuel_logs" ADD CONSTRAINT "fuel_logs_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_trips" ADD CONSTRAINT "vehicle_trips_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_trips" ADD CONSTRAINT "vehicle_trips_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

