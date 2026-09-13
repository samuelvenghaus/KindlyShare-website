-- AlterTable
ALTER TABLE "reviews" ADD COLUMN     "connection_id" TEXT,
ADD COLUMN     "replied_at" TIMESTAMP(3),
ADD COLUMN     "reply_text" TEXT;

-- CreateIndex
CREATE INDEX "reviews_connection_id_idx" ON "reviews"("connection_id");

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_connection_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "platform_connections"("id") ON DELETE SET NULL ON UPDATE CASCADE;
