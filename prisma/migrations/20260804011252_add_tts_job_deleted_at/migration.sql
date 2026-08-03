-- Add soft-delete timestamp to TTS history.
ALTER TABLE "tts_jobs"
ADD COLUMN "deleted_at" TIMESTAMP(3) WITH TIME ZONE;

-- Support filtering active and deleted TTS history.
CREATE INDEX "tts_jobs_deleted_at_idx"
ON "tts_jobs"("deleted_at");