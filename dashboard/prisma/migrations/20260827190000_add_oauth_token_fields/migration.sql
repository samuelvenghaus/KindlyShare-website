-- AlterTable
ALTER TABLE "platform_connections" ADD COLUMN     "refresh_token" TEXT,
ADD COLUMN     "token_expires_at" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "platform_connections_company_id_platform_external_account_i_key" ON "platform_connections"("company_id", "platform", "external_account_id");
