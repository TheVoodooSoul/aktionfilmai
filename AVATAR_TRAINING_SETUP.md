# Avatar Training Workflow - Setup Guide

## Overview

The avatar training workflow has been fully implemented! Characters generated or uploaded are now automatically trained as A2E avatars, enabling better character consistency across all generations.

## What's Been Implemented

### 1. Database Schema
- Added `avatar_id` column to store A2E avatar IDs
- Added `outfit_description` for prompt enhancement
- Added `avatar_status` to track training progress (pending, training, completed, failed)
- Added database index for faster avatar lookups

### 2. API Routes Updated

#### Character Generation (`/api/a2e/character`)
- Automatically trains avatars after generating character images
- Accepts `waitForAvatar` parameter to poll for completion (optional)
- Returns `avatar_id` and `avatar_status` in response

#### Avatar Status Polling (`/api/a2e/avatar-status`)
- GET endpoint to check single avatar status
- POST endpoint to poll until completion
- Automatically updates database when training completes

#### Scene Generation (`/api/a2e/nanobanana`)
- Now accepts `avatar_id` in character references
- Prefers `user_video_twin_ids` over `input_images` when avatars are available
- Falls back to image URLs for non-trained characters

#### Motion Transfer (`/api/a2e/motion-transfer`)
- Accepts either `imageUrl` or `avatarId`
- Uses `user_video_twin_id` parameter when avatar is available
- Better character consistency in animated clips

#### Image-to-Video (`/api/a2e/i2v`)
- Accepts either `image` or `avatarId`
- Uses trained avatars for better consistency
- Falls back to image URLs when needed

#### Lipsync (`/api/a2e/lipsync`)
- Accepts either `image` or `avatarId`
- Supports avatar-based lipsync generation

#### Fight Sequence (`/api/a2e/fight-sequence`)
- Updated to use `avatar_id` from character references
- All fight moves use the same trained avatar for consistency

### 3. Character References
- Canvas page now saves `avatar_id` when creating character refs
- Character refs are loaded with all avatar data from database
- Avatar status is tracked and displayed

## Setup Steps

### 1. Run Database Migration

The migration file is ready at `/migrations/add_avatar_id.sql`. You need to run it via your Supabase dashboard:

1. Go to your Supabase project
2. Navigate to SQL Editor
3. Copy the contents of `/migrations/add_avatar_id.sql`
4. Paste and execute in SQL Editor

Or run via command line (if you have Supabase CLI):
```bash
supabase db push
```

### 2. Environment Variables

Ensure these are set in your `.env.local`:
- `A2E_API_KEY` - Your A2E API key
- `A2E_API_TOKEN` - Your A2E API token (may be same as key)
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key

## How It Works

### Avatar Training Flow

1. **Character Generation**
   ```
   User creates character → A2E Text-to-Image → Image generated
   ↓
   Automatically calls A2E Avatar Training API
   ↓
   Avatar ID stored in character_references table
   ↓
   Status: "training" (avatars take time to train)
   ```

2. **Using Trained Avatars**
   ```
   User selects character for scene → Check if avatar_id exists
   ↓
   If avatar_id: Use user_video_twin_id in API calls
   If no avatar: Fall back to image_url
   ↓
   Better character consistency in all outputs
   ```

3. **Status Polling** (Optional)
   - Set `waitForAvatar: true` in character generation request
   - API will poll for up to 5 minutes waiting for training to complete
   - Or check status later using `/api/a2e/avatar-status`

## Testing the Workflow

### Test 1: Generate Character with Avatar Training
```javascript
const response = await fetch('/api/a2e/character', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: 'muscular action hero, short dark hair, wearing tactical gear',
    userId: 'your-user-id',
    waitForAvatar: false // Set true to wait for training
  })
});

const data = await response.json();
console.log('Avatar ID:', data.avatar_id);
console.log('Avatar Status:', data.avatar_status); // "training"
```

### Test 2: Check Avatar Status
```javascript
const response = await fetch('/api/a2e/avatar-status?avatar_id=YOUR_AVATAR_ID');
const data = await response.json();
console.log('Status:', data.status);
console.log('Is Complete:', data.is_complete);
```

### Test 3: Use Avatar in Scene Generation
```javascript
// First, get character refs from database (they include avatar_id now)
const { data: characterRefs } = await supabase
  .from('character_references')
  .select('*')
  .eq('user_id', userId);

// Generate scene with trained avatars
const response = await fetch('/api/a2e/nanobanana', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: 'epic fight scene in warehouse, dynamic action',
    characterRefs: characterRefs, // Includes avatar_id
    userId: 'your-user-id'
  })
});
```

## Avatar Training Best Practices

### When to Use Avatar Training
✅ Characters that will be used multiple times
✅ Characters that need consistent appearance across scenes
✅ Characters for fight sequences or dialogue
✅ Professional quality character consistency

### When to Skip
❌ One-off background characters
❌ Testing/experimenting with different looks
❌ Quick prototypes

### Model Versions
- **V2.1** (default): More flexible, high motion capability
- **V1.0**: More stable, better for subtle expressions

### Training Time
- Image-based training: ~2-5 minutes
- Video-based training: ~5-10 minutes (better quality for lipsync)
- "Continue Training" option: +30 minutes, 100 credits (highest quality)

## API Parameter Reference

### Character Generation
```typescript
{
  prompt: string;              // Character description
  referenceImage?: string;     // Optional reference image
  userId: string;              // User ID for credits
  waitForAvatar?: boolean;     // Wait for avatar training (default: false)
}
```

### Avatar Status
```typescript
{
  avatar_id: string;           // Avatar ID to check
  max_attempts?: number;       // Max polling attempts (default: 60)
  interval_ms?: number;        // Polling interval (default: 5000)
}
```

### Scene Generation with Avatars
```typescript
{
  prompt: string;              // Scene description
  characterRefs: Array<{       // Character references
    image_url: string;
    avatar_id?: string;        // If available, will be used
    name: string;
  }>;
  sketch?: string;             // Optional sketch
  userId: string;
}
```

## Troubleshooting

### Avatar Training Failed
- Check A2E API key is valid
- Ensure image URL is publicly accessible
- Check console logs for A2E error messages
- Try with different image (some images may not work)

### Character Consistency Issues
- Verify avatar_status is "completed" before using
- Check that avatar_id is being passed in API calls
- Try "Continue Training" for better quality
- Ensure all scenes use the same avatar_id

### Database Issues
- Verify migration was run successfully
- Check that avatar_id column exists
- Ensure character_references table has proper permissions

## Future Enhancements

- [ ] UI indicator for avatar training progress
- [ ] Background polling for avatar status
- [ ] Video-based avatar training option in UI
- [ ] "Continue Training" button for improved quality
- [ ] Avatar gallery/management page
- [ ] Avatar preset creation from trained avatars

## A2E API Documentation

For full A2E API documentation, refer to:
- Avatar Training: `POST /api/v1/anchor/character_list`
- Avatar Status: `GET /api/v1/anchor/character_list/{id}`
- Scene Generation: `POST /api/v1/userNanoBanana/start`
- Motion Transfer: `POST /api/v1/motionTransfer/start`
- Image-to-Video: `POST /api/v1/wanneer/start`
- Talking Video: `POST /api/v1/talkingVideo/start`

## Credits

Avatar training is FREE when creating characters. Only the initial character generation costs credits (2 credits). The avatar is trained automatically at no additional cost.

Using avatars in scenes/animations costs the same as using images (no premium for avatar use).
