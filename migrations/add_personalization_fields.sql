-- Migration: Add Personalization Fields to interview_sessions
-- Date: 2024-01-11
-- Description: Adds fields to store personalization preferences for each interview session

-- Add personalization fields to interview_sessions table
ALTER TABLE interview_sessions
ADD COLUMN IF NOT EXISTS use_personalization BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS personalization_relevance INTEGER DEFAULT 0;

-- Add comment for documentation
COMMENT ON COLUMN interview_sessions.use_personalization IS 'Whether personalized coaching is enabled for this session';
COMMENT ON COLUMN interview_sessions.personalization_relevance IS 'Calculated relevance score (0-100) based on historical data match';

-- Create index for querying personalized sessions
CREATE INDEX IF NOT EXISTS idx_interview_sessions_personalization
ON interview_sessions(user_id, use_personalization)
WHERE use_personalization = TRUE;

-- Verify the migration
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'interview_sessions'
    AND column_name = 'use_personalization'
  ) THEN
    RAISE NOTICE 'Migration successful: use_personalization column added';
  ELSE
    RAISE EXCEPTION 'Migration failed: use_personalization column not found';
  END IF;
END $$;
