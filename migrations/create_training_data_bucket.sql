-- Create storage bucket for training data
INSERT INTO storage.buckets (id, name, public)
VALUES ('training-data', 'training-data', false)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to their own folder (if opted in)
CREATE POLICY "Users can upload training data"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'training-data' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow service role to read all training data
CREATE POLICY "Service can read all training data"
  ON storage.objects
  FOR SELECT
  TO service_role
  USING (bucket_id = 'training-data');

-- Allow service role to insert training data
CREATE POLICY "Service can insert training data"
  ON storage.objects
  FOR INSERT
  TO service_role
  WITH CHECK (bucket_id = 'training-data');

COMMENT ON POLICY "Users can upload training data" ON storage.objects IS 'Users can upload to their folder in training-data bucket';
