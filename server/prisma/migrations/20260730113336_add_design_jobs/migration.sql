-- CreateEnum
CREATE TYPE "DesignJobType" AS ENUM ('Artwork', '3D Design');

-- CreateEnum
CREATE TYPE "DesignJobStatus" AS ENUM ('Pending', 'Done');

-- CreateTable
CREATE TABLE "design_jobs" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "jobType" "DesignJobType" NOT NULL,
    "description" TEXT,
    "sampleFile" TEXT,
    "deadline" TIMESTAMP(3) NOT NULL,
    "status" "DesignJobStatus" NOT NULL DEFAULT 'Pending',
    "assignedById" INTEGER NOT NULL,
    "assignedToId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "design_jobs_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "design_jobs" ADD CONSTRAINT "design_jobs_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "design_jobs" ADD CONSTRAINT "design_jobs_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
