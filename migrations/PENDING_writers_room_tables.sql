-- PENDING: Run this in Supabase SQL Editor
-- https://supabase.com/dashboard/project/bqxxyqlbxyvfuanoiwyh/sql
--
-- Missing tables: script_characters, script_scenes, storyboards, script_analysis

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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_script_characters_script_id ON script_characters(script_id);
CREATE INDEX IF NOT EXISTS idx_script_scenes_script_id ON script_scenes(script_id);
CREATE INDEX IF NOT EXISTS idx_storyboards_script_id ON storyboards(script_id);
CREATE INDEX IF NOT EXISTS idx_storyboards_scene_id ON storyboards(scene_id);

-- RLS
ALTER TABLE script_characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE script_scenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE storyboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE script_analysis ENABLE ROW LEVEL SECURITY;

-- RLS Policies
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
