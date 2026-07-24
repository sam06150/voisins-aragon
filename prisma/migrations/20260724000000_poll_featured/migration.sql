-- AlterTable
ALTER TABLE "Poll" ADD COLUMN     "featured" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Poll_featured_closed_idx" ON "Poll"("featured", "closed");
