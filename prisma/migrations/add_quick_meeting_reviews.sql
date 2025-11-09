-- Tabella per recensioni native degli incontri veloci
CREATE TABLE "QuickMeetingReview" (
  "id" SERIAL PRIMARY KEY,
  "quickMeetingId" INTEGER NOT NULL REFERENCES "QuickMeeting"("id") ON DELETE CASCADE,
  "authorName" TEXT NOT NULL,
  "rating" INTEGER NOT NULL CHECK ("rating" >= 1 AND "rating" <= 5),
  "reviewText" TEXT NOT NULL,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "isApproved" BOOLEAN DEFAULT false,
  "isVisible" BOOLEAN DEFAULT true
);

-- Indici
CREATE INDEX "QuickMeetingReview_quickMeetingId_idx" ON "QuickMeetingReview"("quickMeetingId");
CREATE INDEX "QuickMeetingReview_createdAt_idx" ON "QuickMeetingReview"("createdAt" DESC);
CREATE INDEX "QuickMeetingReview_isApproved_idx" ON "QuickMeetingReview"("isApproved");
