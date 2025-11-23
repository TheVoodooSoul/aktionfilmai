# Database Migrations for Data Sharing Opt-In

## Overview

These migrations add support for the **transparent data sharing opt-in system** where users can opt-in to share their generated outputs in exchange for **10% off membership fees**.

## Migrations to Run

Run these migrations **in order** through the Supabase SQL Editor:

### 1. `add_data_sharing_opt_in.sql`
Adds:
- `data_sharing_opt_in` column to `users` table
- `data_sharing_opted_in_at` timestamp column
- `shared_training_data` table for storing user-contributed outputs
- Row-level security policies
- Analytics view for training data stats

### 2. `create_training_data_bucket.sql`
Creates:
- `training-data` storage bucket (private)
- Storage policies for users and service role

## How to Apply

### Option 1: Supabase Dashboard (Recommended)

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your `aktionfilmai` project
3. Navigate to **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy the contents of `add_data_sharing_opt_in.sql`
6. Paste and click **Run**
7. Repeat for `create_training_data_bucket.sql`

### Option 2: Supabase CLI

```bash
# If you have the Supabase CLI set up and linked
cd /Users/egopanda/aktionfilmai
supabase db push
```

## What This Enables

✅ **User Opt-In UI** - Settings page with transparent data sharing toggle
✅ **10% Membership Discount** - Automatically applied when opted-in
✅ **Training Data Collection** - Automatically saves outputs when user is opted-in
✅ **Analytics** - View stats on contributed training data
✅ **Privacy Controls** - Users can opt-out anytime

## Tables Created

### `shared_training_data`
Stores user-contributed outputs for model training:
- `output_url` - The generated image/video
- `output_type` - 'image' or 'video'
- `node_type` - Generation type (character, scene, sketch, etc.)
- `prompt` - The prompt used
- `settings` - Generation parameters (JSONB)
- `character_refs` - Character references used (JSONB)
- `input_image_url` - Input image for i2i/sketch/i2v
- `input_images` - Array of 6 images for coherent-scene (JSONB)
- `user_rating` - Optional quality rating (1-5)
- `generation_time_seconds` - How long generation took

### Storage Bucket: `training-data`
Stores training data files organized by user ID.

## Security

- **Row Level Security** enabled on all tables
- Users can only view their own shared data
- Service role can insert/read all training data
- Storage policies restrict access to user folders

## Verification

After running migrations, verify:

```sql
-- Check users table has new columns
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'users'
  AND column_name IN ('data_sharing_opt_in', 'data_sharing_opted_in_at');

-- Check shared_training_data table exists
SELECT table_name
FROM information_schema.tables
WHERE table_name = 'shared_training_data';

-- Check training-data bucket exists
SELECT * FROM storage.buckets WHERE id = 'training-data';
```

## Rollback (If Needed)

```sql
-- Remove shared_training_data table
DROP TABLE IF EXISTS shared_training_data CASCADE;
DROP VIEW IF EXISTS training_data_stats;

-- Remove columns from users
ALTER TABLE users
  DROP COLUMN IF EXISTS data_sharing_opt_in,
  DROP COLUMN IF EXISTS data_sharing_opted_in_at;

-- Remove storage bucket
DELETE FROM storage.buckets WHERE id = 'training-data';
```
