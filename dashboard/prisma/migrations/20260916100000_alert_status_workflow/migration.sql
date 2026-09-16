-- CreateEnum
CREATE TYPE "AlertStatus" AS ENUM ('open', 'in_progress', 'resolved');

-- AlterTable: voeg de nieuwe kolom toe vóórdat de oude verdwijnt, zodat bestaande
-- resolved=true rijen naar status='resolved' omgezet kunnen worden.
ALTER TABLE "alerts" ADD COLUMN     "status" "AlertStatus" NOT NULL DEFAULT 'open';

-- Backfill: bestaande opgeloste alerts krijgen de juiste status.
UPDATE "alerts" SET "status" = 'resolved' WHERE "resolved" = true;

-- AlterTable: nu pas de oude boolean-kolom verwijderen.
ALTER TABLE "alerts" DROP COLUMN "resolved";
