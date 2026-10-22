-- AlterTable
ALTER TABLE "applicants" ADD COLUMN     "inquiryNumber" SERIAL NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "applicants_inquiryNumber_key" ON "applicants"("inquiryNumber");

