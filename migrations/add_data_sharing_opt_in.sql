-- Add data sharing opt-in to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS data_sharing_opt_in BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS data_sharing_opted_in_at TIMESTAMP;

-- Create shared_training_data table for collecting user outputs
CREATE TABLE IF NOT EXISTS shared_training_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Output information
  output_url TEXT NOT NULL,
  output_type TEXT NOT NULL CHECK (output_type IN ('image', 'video')),
  node_type TEXT NOT NULL, -- character, scene, sketch, i2i, t2i, i2v, t2v, lipsync, action-pose, coherent-scene

  -- Generation metadata (for model training context)
  prompt TEXT,
  settings JSONB, -- Store creativity, strength, other parameters

  -- Character reference info (if applicable)
  character_refs JSONB, -- Array of character references used

  -- Input data (for supervised learning)
  input_image_url TEXT, -- For i2i, sketch, i2v
  input_images JSONB, -- For coherent-scene (array of 6 images)

  -- Quality metadata
  user_rating INTEGER CHECK (user_rating >= 1 AND user_rating <= 5), -- Optional user rating
  generation_time_seconds INTEGER,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),

  -- Indexes for querying
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_shared_training_data_user_id ON shared_training_data(user_id);
CREATE INDEX IF NOT EXISTS idx_shared_training_data_node_type ON shared_training_data(node_type);
CREATE INDEX IF NOT EXISTS idx_shared_training_data_output_type ON shared_training_data(output_type);
CREATE INDEX IF NOT EXISTS idx_shared_training_data_created_at ON shared_training_data(created_at DESC);

-- Create view for training data analytics
CREATE OR REPLACE VIEW training_data_stats AS
SELECT
  node_type,
  output_type,
  COUNT(*) as total_outputs,
  COUNT(DISTINCT user_id) as unique_users,
  AVG(user_rating) as avg_rating,
  AVG(generation_time_seconds) as avg_generation_time,
  MAX(created_at) as last_contribution
FROM shared_training_data
GROUP BY node_type, output_type;

-- Grant permissions
ALTER TABLE shared_training_data ENABLE ROW LEVEL SECURITY;

-- Users can view their own shared data
CREATE POLICY "Users can view their own shared data"
  ON shared_training_data
  FOR SELECT
  USING (auth.uid() = user_id);

-- System can insert shared data (via service role)
CREATE POLICY "Service can insert shared data"
  ON shared_training_data
  FOR INSERT
  WITH CHECK (true);

COMMENT ON TABLE shared_training_data IS 'Stores user-contributed outputs for model training (opt-in only)';
COMMENT ON COLUMN users.data_sharing_opt_in IS 'User opted in to share outputs for 10% membership discount';
COMMENT ON COLUMN shared_training_data.user_rating IS 'Optional user rating of their own output quality';
