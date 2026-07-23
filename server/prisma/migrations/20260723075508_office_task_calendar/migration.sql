-- CreateEnum
CREATE TYPE "MemoStatus" AS ENUM ('Pending', 'Done');

-- CreateEnum
CREATE TYPE "OfficeTaskStatus" AS ENUM ('Pending', 'Completed');

-- CreateTable
CREATE TABLE "memos" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" "MemoStatus" NOT NULL DEFAULT 'Pending',
    "acknowledgedAt" TIMESTAMP(3),
    "createdById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "memos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "office_tasks" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dueDate" DATE NOT NULL,
    "status" "OfficeTaskStatus" NOT NULL DEFAULT 'Pending',
    "assignedById" INTEGER,
    "assignedToId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "office_tasks_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "memos" ADD CONSTRAINT "memos_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "office_tasks" ADD CONSTRAINT "office_tasks_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "office_tasks" ADD CONSTRAINT "office_tasks_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
