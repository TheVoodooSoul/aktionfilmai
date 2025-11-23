# Writers Room API - A2E Integration

## Overview
The Writers Room API integrates A2E (Avatar2Everyone) features to enhance script writing and video generation workflows.

## API Endpoints

### Script Management
- `GET /api/writers-room/scripts` - List all user scripts
- `POST /api/writers-room/scripts` - Create new script
- `GET /api/writers-room/scripts/[id]` - Get single script
- `PUT /api/writers-room/scripts/[id]` - Update script
- `DELETE /api/writers-room/scripts/[id]` - Delete script

### Script Analysis
- `POST /api/writers-room/analyze` - Analyze script (readability, pacing, suggestions)

### A2E Integration Endpoints

#### Storyboard Generation
- `POST /api/writers-room/storyboard`
  - Generates storyboard images from script scenes using A2E text-to-image
  - **A2E Endpoint**: `/api/v1/userText2image/start`
  - **Features**:
    - Converts scene descriptions to visual storyboard frames
    - Supports different shot types (wide, medium, close, extreme-close)
    - Saves storyboards to database

#### Video Generation
- `POST /api/writers-room/generate-video`
  - Generates video from script scenes using A2E video generation
  - **A2E Endpoints**: 
    - `/api/v1/video/send_tts` (for dialogue audio)
    - `/api/v1/video/generate` (for video creation)
  - **Features**:
    - Converts script dialogue to speech (TTS)
    - Generates avatar videos with dialogue
    - Supports custom backgrounds
    - Links videos back to script scenes

#### Character Avatar Creation
- `POST /api/writers-room/characters/create-avatar`
  - Creates A2E avatars for script characters
  - **A2E Endpoint**: `/api/v1/userVideoTwin/startTraining`
  - **Features**:
    - Creates avatars from character images or videos
    - Video avatars are FREE
    - Image avatars cost 30 credits
    - Links avatars to script characters

#### Dubbing
- `POST /api/writers-room/dubbing`
  - Generates dubbed audio for script dialogue
  - **A2E Endpoint**: `/api/v1/userDubbing/startDubbing`
  - **Features**:
    - Converts dialogue to speech in different languages
    - Supports multiple voice options
    - Links dubbed audio to script scenes

## Workflow Integration

### Complete Script-to-Video Pipeline

1. **Write Script** → Save to database
2. **Analyze Script** → Get insights and suggestions
3. **Create Characters** → Generate character avatars (A2E)
4. **Generate Storyboards** → Visualize scenes (A2E text-to-image)
5. **Generate Videos** → Create videos from scenes (A2E video generation)
6. **Add Dubbing** → Localize dialogue (A2E dubbing)

## A2E API Configuration

All endpoints require:
- `A2E_API_KEY` environment variable
- User authentication (Bearer token)
- Proper Supabase RLS policies

## Credit Costs

- **Video Avatar Training**: FREE
- **Image Avatar Training**: 30 credits
- **Storyboard Generation**: Uses A2E text-to-image (check A2E pricing)
- **Video Generation**: Uses A2E video generation (check A2E pricing)
- **Dubbing**: Uses A2E dubbing (check A2E pricing)

## Example Usage

### Generate Storyboard
```typescript
const response = await fetch('/api/writers-room/storyboard', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    scriptId: 'script-id',
    sceneId: 'scene-id',
    description: 'Hero enters dark warehouse, fists clenched',
    shotType: 'wide',
  }),
});
```

### Create Character Avatar
```typescript
const response = await fetch('/api/writers-room/characters/create-avatar', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    characterId: 'char-id',
    scriptId: 'script-id',
    imageUrl: 'https://example.com/character.jpg',
    name: 'John Hero',
    gender: 'male',
  }),
});
```

### Generate Video from Script
```typescript
const response = await fetch('/api/writers-room/generate-video', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    scriptId: 'script-id',
    sceneId: 'scene-id',
    avatarId: 'a2e-avatar-id',
    dialogue: 'I will find you!',
    backgroundUrl: 'https://example.com/background.jpg',
  }),
});
```

## Error Handling

All endpoints return standard error responses:
- `401` - Unauthorized (missing/invalid token)
- `400` - Bad Request (missing required fields)
- `404` - Not Found (script/character not found)
- `500` - Internal Server Error (A2E API or database error)

## Status

✅ Script Management - Complete
✅ Script Analysis - Complete
✅ Storyboard Generation (A2E) - Complete
✅ Video Generation (A2E) - Complete
✅ Character Avatar Creation (A2E) - Complete
✅ Dubbing (A2E) - Complete



