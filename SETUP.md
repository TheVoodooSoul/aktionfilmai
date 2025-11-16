# Aktion Film AI - Setup Guide

## Database Setup

1. Go to your Supabase project: https://bqxxyqlbxyvfuanoiwyh.supabase.co
2. Navigate to the SQL Editor
3. Copy the contents of `supabase-schema.sql`
4. Paste and run the SQL to create all tables

## Storage Setup

1. In Supabase, go to Storage
2. Create a new bucket called `character-refs`
3. Make it **public** (Settings → Make public)
4. Set up RLS policies:
   ```sql
   -- Allow authenticated users to upload
   CREATE POLICY "Authenticated users can upload character refs"
   ON storage.objects FOR INSERT
   TO authenticated
   WITH CHECK (bucket_id = 'character-refs');

   -- Allow public read access
   CREATE POLICY "Public can view character refs"
   ON storage.objects FOR SELECT
   TO public
   USING (bucket_id = 'character-refs');
   ```

## Environment Variables

All environment variables are already configured in `.env.local`:
- Supabase URL and keys ✓
- RunComfy API token and deployment ID ✓
- Stripe keys ✓
- OpenAI API key ✓

### Missing Workflow IDs

Add these to `.env.local` when you get them:
```bash
DZINE_WORKFLOW_ID=your-dzine-i2i-workflow-id
WAN_INPAINT_WORKFLOW_ID=your-wan-inpaint-workflow-id
WAN_2_2_WORKFLOW_ID=your-wan-2.2-fun-workflow-id
```

## Running Locally

1. Install dependencies (already done):
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

3. Open http://localhost:3000

## Features

### Landing Page (/)
- 80s action movie poster aesthetic
- YouTube video background (looping)
- Film grain texture overlay
- Email capture → saves to `beta_signups` table
- Dynamic rotating features

### Canvas (/canvas)
- Infinite canvas with node-based workflow
- Drawing tools (brush, eraser, line thickness)
- AI creativity gauge
- Character reference upload (max 2)
- Preview generation (1 credit via dzine i2i)
- Node linking for sequences (Wan inpaint)
- i2v generation (Wan 2.2 fun)

### Writers Room (/writers-room)
- Script writing interface
- AI improvement suggestions (OpenAI integration ready)
- Save/export functionality

### Preset Library (/presets)
- Browse public presets
- Search functionality
- Community-created presets

### First Aktion Hero Contest (/contest)
- Monthly video contest
- $10 first entry, $5 subsequent
- Community voting
- Prize pool distribution

## Credit System

- Preview: 1 credit
- Sequence: 5 credits
- i2v: 10 credits

## Training Opt-In

Users can opt-in to share their outputs for model training and receive 10% revenue share.

## Next Steps

1. Run the Supabase SQL schema
2. Set up storage bucket
3. Add RunComfy workflow IDs
4. Test all workflows locally
5. Deploy to Vercel

## Deployment

The app is configured for Vercel deployment. Environment variables are already set in Vercel dashboard.
