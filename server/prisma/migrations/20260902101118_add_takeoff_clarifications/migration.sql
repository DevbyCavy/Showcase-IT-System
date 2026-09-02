-- CreateEnum
CREATE TYPE "TakeoffClarificationStatus" AS ENUM ('Pending', 'Answered');

-- CreateEnum
CREATE TYPE "TakeoffClarificationTopic" AS ENUM ('Material', 'Measurement', 'Other');

-- AlterEnum
ALTER TYPE "TakeoffDesignStatus" ADD VALUE 'NeedsInput';

-- CreateTable
CREATE TABLE "takeoff_clarifications" (
    "id" SERIAL NOT NULL,
    "designId" INTEGER NOT NULL,
    "topic" "TakeoffClarificationTopic" NOT NULL,
    "question" TEXT NOT NULL,
    "status" "TakeoffClarificationStatus" NOT NULL DEFAULT 'Pending',
    "answer" TEXT,
    "answeredById" INTEGER,
    "answeredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "takeoff_clarifications_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "takeoff_clarifications" ADD CONSTRAINT "takeoff_clarifications_designId_fkey" FOREIGN KEY ("designId") REFERENCES "takeoff_designs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "takeoff_clarifications" ADD CONSTRAINT "takeoff_clarifications_answeredById_fkey" FOREIGN KEY ("answeredById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
