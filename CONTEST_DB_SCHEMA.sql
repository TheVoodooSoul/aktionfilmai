-- AktionFilmAI Contest Database Schema

-- Contests table (monthly contests)
CREATE TABLE IF NOT EXISTS contests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  theme TEXT NOT NULL,
  description TEXT,
  start_date TIMESTAMP NOT NULL,
  submission_deadline TIMESTAMP NOT NULL,
  announcement_date TIMESTAMP NOT NULL,
  first_submission_price INTEGER DEFAULT 1000, -- in cents ($10)
  additional_submission_price INTEGER DEFAULT 500, -- in cents ($5)
  status TEXT DEFAULT 'active', -- active, voting, completed
  total_pot INTEGER DEFAULT 0, -- total prize pool in cents
  created_at TIMESTAMP DEFAULT NOW()
);

-- Contest submissions
CREATE TABLE IF NOT EXISTS contest_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id UUID REFERENCES contests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  user_email TEXT NOT NULL,
  user_name TEXT,
  submission_name TEXT NOT NULL,
  video_url TEXT NOT NULL,
  platform TEXT, -- youtube, instagram, tiktok, twitter, etc
  description TEXT,
  duration INTEGER, -- in seconds
  payment_intent_id TEXT, -- Stripe payment intent ID
  amount_paid INTEGER NOT NULL, -- in cents
  is_first_submission BOOLEAN DEFAULT true,
  staff_votes INTEGER DEFAULT 0,
  community_votes INTEGER DEFAULT 0,
  is_staff_pick BOOLEAN DEFAULT false,
  is_community_pick BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'pending', -- pending, approved, rejected, winner
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Voting records (prevent duplicate votes)
CREATE TABLE IF NOT EXISTS contest_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID REFERENCES contest_submissions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  vote_type TEXT NOT NULL, -- community, staff
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(submission_id, user_id, vote_type)
);

-- Contest winners
CREATE TABLE IF NOT EXISTS contest_winners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id UUID REFERENCES contests(id) ON DELETE CASCADE,
  submission_id UUID REFERENCES contest_submissions(id) ON DELETE CASCADE,
  winner_type TEXT NOT NULL, -- staff_pick, community_pick
  prize_amount INTEGER NOT NULL, -- in cents
  announced_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_submissions_contest ON contest_submissions(contest_id);
CREATE INDEX IF NOT EXISTS idx_submissions_user ON contest_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_votes_submission ON contest_votes(submission_id);
CREATE INDEX IF NOT EXISTS idx_votes_user ON contest_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_winners_contest ON contest_winners(contest_id);

-- Insert the first contest
INSERT INTO contests (
  name,
  theme,
  description,
  start_date,
  submission_deadline,
  announcement_date,
  first_submission_price,
  additional_submission_price,
  status
) VALUES (
  'First Aktion Hero Contest',
  'A Christmas Story',
  'The inaugural Aktion Hero competition - create a 1-3 minute action short with a Christmas theme. Interpret it however you please: violent gingerbread revenge, Santa''s last stand, elf noir, Die Hard with lightsabers - tasteful insanity encouraged.',
  '2024-12-01 00:00:00',
  '2024-12-23 23:59:59',
  '2025-01-01 00:00:00',
  1000,
  500,
  'active'
) ON CONFLICT DO NOTHING;

-- Add contest-related columns to profiles if they don't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS contest_submissions_count INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS contest_wins INTEGER DEFAULT 0;

-- Submission tokens (1 token = 1 submission + 3 votes)
CREATE TABLE IF NOT EXISTS submission_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  contest_id UUID REFERENCES contests(id) ON DELETE CASCADE,
  token_code TEXT UNIQUE NOT NULL, -- unique token code
  payment_intent_id TEXT, -- Stripe payment intent ID
  amount_paid INTEGER NOT NULL, -- in cents ($10 or $5)
  submission_allowance INTEGER DEFAULT 1, -- can submit once
  votes_remaining INTEGER DEFAULT 3, -- can vote 3 times
  is_first_purchase BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'active', -- active, used, expired
  created_at TIMESTAMP DEFAULT NOW(),
  used_for_submission_at TIMESTAMP,
  expires_at TIMESTAMP
);

-- Track which votes were made with which token
CREATE TABLE IF NOT EXISTS token_vote_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id UUID REFERENCES submission_tokens(id) ON DELETE CASCADE,
  vote_id UUID REFERENCES contest_votes(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(token_id, vote_id)
);

-- Indexes for token queries
CREATE INDEX IF NOT EXISTS idx_tokens_user ON submission_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_tokens_contest ON submission_tokens(contest_id);
CREATE INDEX IF NOT EXISTS idx_tokens_status ON submission_tokens(status);
CREATE INDEX IF NOT EXISTS idx_token_votes_token ON token_vote_usage(token_id);
CREATE INDEX IF NOT EXISTS idx_token_votes_vote ON token_vote_usage(vote_id);
