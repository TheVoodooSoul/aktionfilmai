-- Writers Room Database Schema
-- Integration for AktionFilmAI

-- Scripts table
CREATE TABLE IF NOT EXISTS scripts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Script characters table
CREATE TABLE IF NOT EXISTS script_characters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  script_id UUID REFERENCES scripts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  traits TEXT[],
  role TEXT CHECK (role IN ('protagonist', 'antagonist', 'supporting', 'extra')),
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(script_id, name)
);

-- Script scenes table
CREATE TABLE IF NOT EXISTS script_scenes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  script_id UUID REFERENCES scripts(id) ON DELETE CASCADE,
  scene_number INTEGER NOT NULL,
  title TEXT,
  content TEXT NOT NULL,
  location TEXT,
  time_of_day TEXT CHECK (time_of_day IN ('day', 'night', 'dawn', 'dusk', 'unknown')),
  characters TEXT[],
  action_beats TEXT[],
  dialogue TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(script_id, scene_number)
);

-- Storyboards table
CREATE TABLE IF NOT EXISTS storyboards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  script_id UUID REFERENCES scripts(id) ON DELETE CASCADE,
  scene_id UUID REFERENCES script_scenes(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  description TEXT,
  shot_type TEXT CHECK (shot_type IN ('wide', 'medium', 'close', 'extreme-close')),
  camera_angle TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Script analysis cache
CREATE TABLE IF NOT EXISTS script_analysis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  script_id UUID REFERENCES scripts(id) ON DELETE CASCADE,
  readability NUMERIC,
  pacing TEXT CHECK (pacing IN ('slow', 'medium', 'fast')),
  action_density NUMERIC,
  dialogue_ratio NUMERIC,
  scene_count INTEGER,
  average_scene_length NUMERIC,
  suggestions JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(script_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_scripts_user_id ON scripts(user_id);
CREATE INDEX IF NOT EXISTS idx_scripts_created_at ON scripts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_script_characters_script_id ON script_characters(script_id);
CREATE INDEX IF NOT EXISTS idx_script_scenes_script_id ON script_scenes(script_id);
CREATE INDEX IF NOT EXISTS idx_storyboards_script_id ON storyboards(script_id);
CREATE INDEX IF NOT EXISTS idx_storyboards_scene_id ON storyboards(scene_id);

-- RLS Policies (Row Level Security)
ALTER TABLE scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE script_characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE script_scenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE storyboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE script_analysis ENABLE ROW LEVEL SECURITY;

-- Users can only see their own scripts
CREATE POLICY "Users can view own scripts" ON scripts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own scripts" ON scripts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own scripts" ON scripts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own scripts" ON scripts
  FOR DELETE USING (auth.uid() = user_id);

-- Similar policies for other tables
CREATE POLICY "Users can manage own script characters" ON script_characters
  FOR ALL USING (
    EXISTS (SELECT 1 FROM scripts WHERE scripts.id = script_characters.script_id AND scripts.user_id = auth.uid())
  );

CREATE POLICY "Users can manage own script scenes" ON script_scenes
  FOR ALL USING (
    EXISTS (SELECT 1 FROM scripts WHERE scripts.id = script_scenes.script_id AND scripts.user_id = auth.uid())
  );

CREATE POLICY "Users can manage own storyboards" ON storyboards
  FOR ALL USING (
    EXISTS (SELECT 1 FROM scripts WHERE scripts.id = storyboards.script_id AND scripts.user_id = auth.uid())
  );

CREATE POLICY "Users can view own script analysis" ON script_analysis
  FOR ALL USING (
    EXISTS (SELECT 1 FROM scripts WHERE scripts.id = script_analysis.script_id AND scripts.user_id = auth.uid())
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_scripts_updated_at
  BEFORE UPDATE ON scripts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
