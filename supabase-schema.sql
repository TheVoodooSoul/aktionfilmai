-- Aktion Film AI Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  credits INTEGER DEFAULT 0,
  subscription_tier TEXT DEFAULT 'free', -- 'free', 'basic', 'pro'
  subscription_status TEXT DEFAULT 'inactive', -- 'active', 'inactive', 'cancelled'
  training_opt_in BOOLEAN DEFAULT false,
  training_revenue_share NUMERIC(5,2) DEFAULT 0.10, -- 10% share
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Beta signups table
CREATE TABLE IF NOT EXISTS beta_signups (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Character references table
CREATE TABLE IF NOT EXISTS character_references (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  image_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Canvas projects table
CREATE TABLE IF NOT EXISTS canvas_projects (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  data JSONB NOT NULL, -- Stores nodes, connections, canvas state
  thumbnail_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Generated outputs table (for training opt-in users)
CREATE TABLE IF NOT EXISTS generated_outputs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  project_id UUID REFERENCES canvas_projects(id) ON DELETE CASCADE,
  output_type TEXT NOT NULL, -- 'image', 'video', 'sequence'
  output_url TEXT NOT NULL,
  prompt_data JSONB, -- Stores prompts, settings used
  allow_training BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scripts table (Writers Room)
CREATE TABLE IF NOT EXISTS scripts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  metadata JSONB, -- Stores AI suggestions, versions, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Presets table
CREATE TABLE IF NOT EXISTS presets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  preset_data JSONB NOT NULL, -- Stores settings, parameters
  is_public BOOLEAN DEFAULT false,
  uses_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Contest submissions table (First Aktion Hero)
CREATE TABLE IF NOT EXISTS contest_submissions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  contest_month TEXT NOT NULL, -- 'YYYY-MM'
  video_url TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  votes INTEGER DEFAULT 0,
  entry_fee_paid BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Contest votes table
CREATE TABLE IF NOT EXISTS contest_votes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  submission_id UUID REFERENCES contest_submissions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(submission_id, user_id)
);

-- Credit transactions table
CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL, -- Positive for credit, negative for debit
  transaction_type TEXT NOT NULL, -- 'purchase', 'preview', 'generation', 'refund'
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security (RLS) Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE character_references ENABLE ROW LEVEL SECURITY;
ALTER TABLE canvas_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_outputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE presets ENABLE ROW LEVEL SECURITY;
ALTER TABLE contest_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE contest_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Character references policies
CREATE POLICY "Users can view own character references" ON character_references FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own character references" ON character_references FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own character references" ON character_references FOR DELETE USING (auth.uid() = user_id);

-- Canvas projects policies
CREATE POLICY "Users can view own projects" ON canvas_projects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own projects" ON canvas_projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own projects" ON canvas_projects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own projects" ON canvas_projects FOR DELETE USING (auth.uid() = user_id);

-- Generated outputs policies
CREATE POLICY "Users can view own outputs" ON generated_outputs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own outputs" ON generated_outputs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Scripts policies
CREATE POLICY "Users can view own scripts" ON scripts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own scripts" ON scripts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own scripts" ON scripts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own scripts" ON scripts FOR DELETE USING (auth.uid() = user_id);

-- Presets policies
CREATE POLICY "Users can view public presets" ON presets FOR SELECT USING (is_public = true OR auth.uid() = user_id);
CREATE POLICY "Users can insert own presets" ON presets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own presets" ON presets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own presets" ON presets FOR DELETE USING (auth.uid() = user_id);

-- Contest submissions policies
CREATE POLICY "Anyone can view submissions" ON contest_submissions FOR SELECT USING (true);
CREATE POLICY "Users can insert own submissions" ON contest_submissions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own submissions" ON contest_submissions FOR UPDATE USING (auth.uid() = user_id);

-- Contest votes policies
CREATE POLICY "Anyone can view votes" ON contest_votes FOR SELECT USING (true);
CREATE POLICY "Users can insert own votes" ON contest_votes FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Credit transactions policies
CREATE POLICY "Users can view own transactions" ON credit_transactions FOR SELECT USING (auth.uid() = user_id);

-- Beta signups is public (no RLS needed for inserts)
ALTER TABLE beta_signups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can signup for beta" ON beta_signups FOR INSERT WITH CHECK (true);

-- Functions
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_canvas_projects_updated_at BEFORE UPDATE ON canvas_projects FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_scripts_updated_at BEFORE UPDATE ON scripts FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Indexes for performance
CREATE INDEX idx_character_references_user_id ON character_references(user_id);
CREATE INDEX idx_canvas_projects_user_id ON canvas_projects(user_id);
CREATE INDEX idx_generated_outputs_user_id ON generated_outputs(user_id);
CREATE INDEX idx_scripts_user_id ON scripts(user_id);
CREATE INDEX idx_presets_user_id ON presets(user_id);
CREATE INDEX idx_presets_public ON presets(is_public);
CREATE INDEX idx_contest_submissions_month ON contest_submissions(contest_month);
CREATE INDEX idx_credit_transactions_user_id ON credit_transactions(user_id);
