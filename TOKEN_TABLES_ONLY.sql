-- Just the token tables (run this if contests table already exists)

-- First, let's check if we need to add contest_id to existing tables
-- Skip this if you get errors - it means the columns already exist

-- Submission tokens (1 token = 1 submission + 3 votes)
CREATE TABLE IF NOT EXISTS submission_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  token_code TEXT UNIQUE NOT NULL,
  payment_intent_id TEXT,
  amount_paid INTEGER NOT NULL,
  submission_allowance INTEGER DEFAULT 1,
  votes_remaining INTEGER DEFAULT 3,
  is_first_purchase BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  used_for_submission_at TIMESTAMP,
  expires_at TIMESTAMP
);

-- Track which votes were made with which token
CREATE TABLE IF NOT EXISTS token_vote_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id UUID REFERENCES submission_tokens(id) ON DELETE CASCADE,
  vote_id UUID,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for token queries
CREATE INDEX IF NOT EXISTS idx_tokens_user ON submission_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_tokens_status ON submission_tokens(status);
CREATE INDEX IF NOT EXISTS idx_token_votes_token ON token_vote_usage(token_id);
