-- AlterTable
ALTER TABLE "applications" ADD COLUMN     "inquirySeq" INTEGER NOT NULL DEFAULT 1;

-- Backfill: number each submission's existing applications 1, 2, 3... in the order they were created,
-- so the unique index below can be created on databases that already have multi-case submissions.
UPDATE "applications" AS a
SET "inquirySeq" = s.seq
FROM (
  SELECT "id", ROW_NUMBER() OVER (PARTITION BY "applicantId" ORDER BY "createdAt", "id") AS seq
  FROM "applications"
) AS s
WHERE a."id" = s."id";

-- CreateIndex
CREATE UNIQUE INDEX "applications_applicantId_inquirySeq_key" ON "applications"("applicantId", "inquirySeq");
