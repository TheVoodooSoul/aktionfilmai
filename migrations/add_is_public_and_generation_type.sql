-- Add is_public and generation_type columns to character_references
-- This enables privacy controls and filtering avatars from scenes/storyboards

-- Add is_public column (default to false = private)
ALTER TABLE character_references
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;

-- Add generation_type column to distinguish between different generation types
-- Values: 'avatar', 'scene', 'storyboard', 'image', 'video'
ALTER TABLE character_references
ADD COLUMN IF NOT EXISTS generation_type TEXT DEFAULT 'avatar';

-- Add index for filtering by generation_type
CREATE INDEX IF NOT EXISTS idx_character_references_generation_type ON character_references(generation_type);

-- Add index for filtering public items
CREATE INDEX IF NOT EXISTS idx_character_references_is_public ON character_references(is_public);

-- Update RLS policy to allow viewing public avatars from other users
DROP POLICY IF EXISTS "Users can view own character references" ON character_references;
CREATE POLICY "Users can view own or public character references" ON character_references
FOR SELECT USING (auth.uid() = user_id OR is_public = true);

-- Add update policy for character_references (for toggling privacy)
DROP POLICY IF EXISTS "Users can update own character references" ON character_references;
CREATE POLICY "Users can update own character references" ON character_references
FOR UPDATE USING (auth.uid() = user_id);

COMMENT ON COLUMN character_references.is_public IS 'Whether this avatar is visible to other users in the community gallery';
COMMENT ON COLUMN character_references.generation_type IS 'Type of generation: avatar, scene, storyboard, image, video';
