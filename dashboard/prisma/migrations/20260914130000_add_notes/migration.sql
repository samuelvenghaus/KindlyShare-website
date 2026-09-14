-- CreateTable
CREATE TABLE "notes" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "review_id" TEXT,
    "alert_id" TEXT,
    "author_id" TEXT,
    "text" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notes_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "notes_target_check" CHECK (num_nonnulls("review_id", "alert_id") = 1)
);

-- CreateIndex
CREATE INDEX "notes_review_id_idx" ON "notes"("review_id");

-- CreateIndex
CREATE INDEX "notes_alert_id_idx" ON "notes"("alert_id");

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_alert_id_fkey" FOREIGN KEY ("alert_id") REFERENCES "alerts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
