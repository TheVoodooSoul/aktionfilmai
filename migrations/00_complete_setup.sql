-- AktionFilmAI Complete Database Setup
-- Run this in your Supabase SQL Editor to set up everything

-- 1. Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  credits INTEGER DEFAULT 100,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create credit_transactions table
CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  amount INTEGER NOT NULL,
  transaction_type TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create character_references table (for Writers Room)
CREATE TABLE IF NOT EXISTS character_references (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  image_url TEXT,
  description TEXT,
  avatar_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create beta_signups table
CREATE TABLE IF NOT EXISTS beta_signups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Enable Row Level Security on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE character_references ENABLE ROW LEVEL SECURITY;
ALTER TABLE beta_signups ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies for profiles
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- 8. RLS Policies for credit_transactions
DROP POLICY IF EXISTS "Users can view own transactions" ON credit_transactions;
CREATE POLICY "Users can view own transactions"
  ON credit_transactions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can insert transactions" ON credit_transactions;
CREATE POLICY "System can insert transactions"
  ON credit_transactions FOR INSERT
  WITH CHECK (true); -- API handles user validation

-- 9. RLS Policies for character_references
DROP POLICY IF EXISTS "Users can view own characters" ON character_references;
CREATE POLICY "Users can view own characters"
  ON character_references FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own characters" ON character_references;
CREATE POLICY "Users can create own characters"
  ON character_references FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own characters" ON character_references;
CREATE POLICY "Users can update own characters"
  ON character_references FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own characters" ON character_references;
CREATE POLICY "Users can delete own characters"
  ON character_references FOR DELETE
  USING (auth.uid() = user_id);

-- 10. RLS Policies for beta_signups
DROP POLICY IF EXISTS "Anyone can insert beta signups" ON beta_signups;
CREATE POLICY "Anyone can insert beta signups"
  ON beta_signups FOR INSERT
  WITH CHECK (true);

-- 11. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_character_references_user ON character_references(user_id);

-- 12. Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 13. Add updated_at triggers
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_character_references_updated_at ON character_references;
CREATE TRIGGER update_character_references_updated_at
  BEFORE UPDATE ON character_references
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 14. Create storage bucket for character uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('character-uploads', 'character-uploads', true)
ON CONFLICT (id) DO NOTHING;

-- 15. Storage bucket policy - allow authenticated users to upload
DROP POLICY IF EXISTS "Users can upload own files" ON storage.objects;
CREATE POLICY "Users can upload own files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'character-uploads' AND
    auth.role() = 'authenticated'
  );

DROP POLICY IF EXISTS "Users can view all files" ON storage.objects;
CREATE POLICY "Users can view all files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'character-uploads');

DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;
CREATE POLICY "Users can delete own files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'character-uploads' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- 16. Function to create profile automatically when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, credits)
  VALUES (NEW.id, NEW.email, 100);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 17. Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- DONE! Database structure is ready.
-- Now manually create super admin user below:
-- ============================================

-- MANUAL STEP: Create super admin user in Authentication > Users
-- Email: admin@aktionfilm.ai
-- Password: (your choice)
-- Then copy the User ID and run the following:

-- UPDATE profiles
-- SET credits = 9999, is_admin = true
-- WHERE id = 'PASTE_USER_ID_HERE';
