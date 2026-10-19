-- CreateEnum
CREATE TYPE "PayoutRequestStatus" AS ENUM ('PENDING', 'PAID');

-- CreateEnum
CREATE TYPE "PayoutMethod" AS ENUM ('BANK_TRANSFER');

-- AlterTable
ALTER TABLE "applications" ADD COLUMN     "payoutRequestId" TEXT,
ADD COLUMN     "referrerReportedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "payout_requests" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "method" "PayoutMethod" NOT NULL DEFAULT 'BANK_TRANSFER',
    "status" "PayoutRequestStatus" NOT NULL DEFAULT 'PENDING',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMP(3),

    CONSTRAINT "payout_requests_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_payoutRequestId_fkey" FOREIGN KEY ("payoutRequestId") REFERENCES "payout_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payout_requests" ADD CONSTRAINT "payout_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
