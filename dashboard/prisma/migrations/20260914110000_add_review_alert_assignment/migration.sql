-- AlterTable
ALTER TABLE "alerts" ADD COLUMN     "assigned_to_id" TEXT;

-- AlterTable
ALTER TABLE "reviews" ADD COLUMN     "assigned_to_id" TEXT;

-- CreateIndex
CREATE INDEX "alerts_assigned_to_id_idx" ON "alerts"("assigned_to_id");

-- CreateIndex
CREATE INDEX "reviews_assigned_to_id_idx" ON "reviews"("assigned_to_id");

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_assigned_to_id_fkey" FOREIGN KEY ("assigned_to_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_assigned_to_id_fkey" FOREIGN KEY ("assigned_to_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
