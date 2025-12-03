-- Simple schema without auth for testing
-- Run this in Supabase SQL Editor

-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create user_credits table
CREATE TABLE IF NOT EXISTS public.user_credits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  credits INTEGER DEFAULT 100 NOT NULL
);

-- Insert a test user with credits
INSERT INTO public.users (email) 
VALUES ('test@example.com') 
ON CONFLICT (email) DO NOTHING;

INSERT INTO public.user_credits (user_id, credits)
SELECT id, 100 FROM public.users WHERE email = 'test@example.com'
ON CONFLICT DO NOTHING;