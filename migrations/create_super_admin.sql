-- Create Super Admin Account
-- This creates a test admin account with unlimited credits

-- First, you need to create the auth user in Supabase Dashboard or via API
-- Then run this to set up the profile

-- Insert or update super admin profile
INSERT INTO profiles (id, email, credits, is_admin)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'admin@aktionfilm.ai',
  9999,
  true
)
ON CONFLICT (id)
DO UPDATE SET
  credits = 9999,
  is_admin = true;

-- Add is_admin column if it doesn't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Grant super admin all privileges
UPDATE profiles
SET
  credits = 9999,
  is_admin = true
WHERE id = '00000000-0000-0000-0000-000000000001';
