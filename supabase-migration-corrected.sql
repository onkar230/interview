-- ============================================
-- Stripe Subscription Migration (CORRECTED)
-- Table: user_profiles (not users)
-- ============================================

-- Add subscription columns to user_profiles table
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro')),
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active',
ADD COLUMN IF NOT EXISTS subscription_current_period_start TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS subscription_current_period_end TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS interviews_used_this_month INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS interviews_reset_at TIMESTAMPTZ DEFAULT date_trunc('month', CURRENT_TIMESTAMP) + INTERVAL '1 month';

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_stripe_customer ON user_profiles(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_subscription_tier ON user_profiles(subscription_tier);

-- Create subscription events audit table
CREATE TABLE IF NOT EXISTS subscription_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  stripe_event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  event_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_subscription_events_user ON subscription_events(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_events_type ON subscription_events(event_type);

-- Auto-reset interview counter trigger
CREATE OR REPLACE FUNCTION reset_interview_counter()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.subscription_tier = 'free' AND NEW.interviews_reset_at <= CURRENT_TIMESTAMP THEN
    NEW.interviews_used_this_month := 0;
    NEW.interviews_reset_at := date_trunc('month', CURRENT_TIMESTAMP) + INTERVAL '1 month';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_reset_interview_counter
BEFORE UPDATE ON user_profiles
FOR EACH ROW
EXECUTE FUNCTION reset_interview_counter();

-- Atomic increment function
CREATE OR REPLACE FUNCTION increment_interview_counter(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE user_profiles
  SET interviews_used_this_month = interviews_used_this_month + 1
  WHERE id = p_user_id AND subscription_tier = 'free';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Set existing users to free tier (1 interview per month)
UPDATE user_profiles
SET
  subscription_tier = 'free',
  subscription_status = 'active',
  interviews_used_this_month = 0,
  interviews_reset_at = date_trunc('month', CURRENT_TIMESTAMP) + INTERVAL '1 month'
WHERE subscription_tier IS NULL;
