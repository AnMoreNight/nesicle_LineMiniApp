-- AlterTable
ALTER TABLE "cases" ADD COLUMN     "providerUrl" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "showProviderUrl" BOOLEAN NOT NULL DEFAULT false;

