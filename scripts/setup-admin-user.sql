-- Setup Admin User SQL
-- After creating the user in Supabase Auth, paste their User ID below and run this

-- Replace 'PASTE_USER_ID_HERE' with the actual User ID from Supabase Auth
UPDATE profiles 
SET 
  credits = 9999, 
  is_admin = true 
WHERE id = 'PASTE_USER_ID_HERE';

-- Verify the update
SELECT id, email, credits, is_admin 
FROM profiles 
WHERE id = 'PASTE_USER_ID_HERE';



