-- Combined migration: Add avatar columns, privacy controls, and storage bucket

-- 1. Add avatar_id column to character_references table
ALTER TABLE character_references
ADD COLUMN IF NOT EXISTS avatar_id TEXT,
ADD COLUMN IF NOT EXISTS outfit_description TEXT,
ADD COLUMN IF NOT EXISTS avatar_status TEXT DEFAULT 'pending';

-- 2. Add is_public and generation_type columns
ALTER TABLE character_references
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;

ALTER TABLE character_references
ADD COLUMN IF NOT EXISTS generation_type TEXT DEFAULT 'avatar';

-- 3. Add indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_character_references_avatar_id ON character_references(avatar_id);
CREATE INDEX IF NOT EXISTS idx_character_references_generation_type ON character_references(generation_type);
CREATE INDEX IF NOT EXISTS idx_character_references_is_public ON character_references(is_public);

-- 4. Update RLS policies to allow viewing public avatars from other users
DROP POLICY IF EXISTS "Users can view own character references" ON character_references;
DROP POLICY IF EXISTS "Users can view own characters" ON character_references;
CREATE POLICY "Users can view own or public character references" ON character_references
FOR SELECT USING (auth.uid() = user_id OR is_public = true);

-- Add update policy for character_references (for toggling privacy)
DROP POLICY IF EXISTS "Users can update own character references" ON character_references;
DROP POLICY IF EXISTS "Users can update own characters" ON character_references;
CREATE POLICY "Users can update own character references" ON character_references
FOR UPDATE USING (auth.uid() = user_id);

-- 5. Create storage bucket for character uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('character-uploads', 'character-uploads', true)
ON CONFLICT (id) DO NOTHING;

-- 6. Set up storage policies (with IF NOT EXISTS equivalent using DO blocks)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read access on character-uploads'
  ) THEN
    CREATE POLICY "Allow public read access on character-uploads"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'character-uploads');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Allow authenticated users to upload to character-uploads'
  ) THEN
    CREATE POLICY "Allow authenticated users to upload to character-uploads"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'character-uploads' AND auth.role() = 'authenticated');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Allow users to update own files in character-uploads'
  ) THEN
    CREATE POLICY "Allow users to update own files in character-uploads"
    ON storage.objects FOR UPDATE
    USING (bucket_id = 'character-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Allow users to delete own files in character-uploads'
  ) THEN
    CREATE POLICY "Allow users to delete own files in character-uploads"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'character-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;
END $$;

-- Add column comments
COMMENT ON COLUMN character_references.avatar_id IS 'A2E Avatar ID (user_video_twin_id) for trained avatars';
COMMENT ON COLUMN character_references.outfit_description IS 'Description of character outfit for prompt enhancement';
COMMENT ON COLUMN character_references.avatar_status IS 'Avatar training status: pending, training, completed, failed';
COMMENT ON COLUMN character_references.is_public IS 'Whether this avatar is visible to other users in the community gallery';
COMMENT ON COLUMN character_references.generation_type IS 'Type of generation: avatar, scene, storyboard, image, video';
