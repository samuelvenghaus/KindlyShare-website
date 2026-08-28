-- AlterTable
ALTER TABLE "companies" ADD COLUMN     "alert_email_enabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "alert_slack_webhook_url" TEXT;
