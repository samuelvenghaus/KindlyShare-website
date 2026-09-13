-- AlterEnum
ALTER TYPE "Platform" ADD VALUE 'widget';

-- AlterTable
ALTER TABLE "companies" ADD COLUMN     "widget_token" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "companies_widget_token_key" ON "companies"("widget_token");
