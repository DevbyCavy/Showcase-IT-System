-- CreateEnum
CREATE TYPE "WorkTaskStatus" AS ENUM ('Running', 'Completed');

-- CreateEnum
CREATE TYPE "QuotationStatus" AS ENUM ('Pending', 'Approved');

-- CreateTable
CREATE TABLE "work_shifts" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "shiftDate" DATE NOT NULL,
    "loginTime" TIMESTAMP(3) NOT NULL,
    "eveningShift" BOOLEAN NOT NULL DEFAULT false,
    "logoutTime" TIMESTAMP(3),

    CONSTRAINT "work_shifts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_tasks" (
    "id" SERIAL NOT NULL,
    "shiftId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "taskName" TEXT NOT NULL,
    "taskNotes" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),
    "status" "WorkTaskStatus" NOT NULL DEFAULT 'Running',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "work_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotations" (
    "id" SERIAL NOT NULL,
    "quotationNumber" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerId" TEXT,
    "projectName" TEXT,
    "orderNumber" TEXT,
    "quoteDate" DATE NOT NULL,
    "termsConditions" TEXT NOT NULL,
    "designFile" TEXT,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "total" DECIMAL(12,2) NOT NULL,
    "status" "QuotationStatus" NOT NULL DEFAULT 'Pending',
    "submittedById" INTEGER NOT NULL,
    "approvedById" INTEGER,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quotations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotation_items" (
    "id" SERIAL NOT NULL,
    "quotationId" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(12,2) NOT NULL,
    "unitPrice" DECIMAL(12,2) NOT NULL,
    "lineTotal" DECIMAL(12,2) NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "quotation_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "work_shifts_userId_shiftDate_key" ON "work_shifts"("userId", "shiftDate");

-- CreateIndex
CREATE UNIQUE INDEX "quotations_quotationNumber_key" ON "quotations"("quotationNumber");

-- AddForeignKey
ALTER TABLE "work_shifts" ADD CONSTRAINT "work_shifts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_tasks" ADD CONSTRAINT "work_tasks_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "work_shifts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_tasks" ADD CONSTRAINT "work_tasks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotation_items" ADD CONSTRAINT "quotation_items_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "quotations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
