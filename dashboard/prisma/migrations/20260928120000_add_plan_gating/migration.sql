-- CreateEnum
CREATE TYPE "Plan" AS ENUM ('basic', 'genius', 'genius_plus');

-- AlterTable: nieuwe kolommen zijn allemaal nullable, dus dit is puur additief -
-- bestaande bedrijven krijgen plan = NULL (nog geen plan gekozen).
ALTER TABLE "companies" ADD COLUMN     "activation_code" TEXT,
ADD COLUMN     "plan" "Plan",
ADD COLUMN     "plan_activated_at" TIMESTAMP(3);
