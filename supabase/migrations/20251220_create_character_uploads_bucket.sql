-- Create storage bucket for character uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('character-uploads', 'character-uploads', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies
CREATE POLICY "Allow public read access on character-uploads"
ON storage.objects FOR SELECT
USING (bucket_id = 'character-uploads');

CREATE POLICY "Allow authenticated users to upload to character-uploads"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'character-uploads'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Allow users to update own files in character-uploads"
ON storage.objects FOR UPDATE
USING (bucket_id = 'character-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Allow users to delete own files in character-uploads"
ON storage.objects FOR DELETE
USING (bucket_id = 'character-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);
