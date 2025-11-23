-- Add avatar_id column to character_references table
ALTER TABLE character_references
ADD COLUMN IF NOT EXISTS avatar_id TEXT,
ADD COLUMN IF NOT EXISTS outfit_description TEXT,
ADD COLUMN IF NOT EXISTS avatar_status TEXT DEFAULT 'pending';

-- Add index for faster avatar_id lookups
CREATE INDEX IF NOT EXISTS idx_character_references_avatar_id ON character_references(avatar_id);

COMMENT ON COLUMN character_references.avatar_id IS 'A2E Avatar ID (user_video_twin_id) for trained avatars';
COMMENT ON COLUMN character_references.outfit_description IS 'Description of character outfit for prompt enhancement';
COMMENT ON COLUMN character_references.avatar_status IS 'Avatar training status: pending, training, completed, failed';
