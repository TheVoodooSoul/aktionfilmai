# AKTION FILM AI - CURRENT STATE & WORKFLOW

**Last Updated:** Nov 18, 2024

## PROJECT VISION

**AktionFilmAI** is a node-based canvas system for creating cinematic action sequences. Users can:
- Generate uncensored action characters
- Create action poses with custom trained LoRAs (punch, kick, takedown)
- Build complete action scenes
- Convert static images to videos
- Add dialogue/lipsync
- Link frames together for sequences

## FULL USER WORKFLOW (End-to-End)

### Step 1: Create Characters
- Upload reference image OR
- Generate from text description using A2E
- Add to character reference slots (max 2)
- Name them (e.g., @hero, @villain)
- Add costume descriptions

### Step 2: Create Action Poses/Scenes
Multiple options:
- **Action Pose Node** (NEW - just added) - Draw sketch → select action (punch/kick/takedown) → generate with trained LoRAs
- **Sketch Node** - Draw → convert to image using Dzine
- **Text-to-Image** - Describe scene → generate
- **Scene Builder** (RunPod) - Combine characters + environment + action type

### Step 3: Animate
- **Image-to-Video** (A2E Wan 2.5) - Make single image move
- **Sequence** (RunComfy Wan Inpaint) - Interpolate between first frame + last frame to create smooth transition video

### Step 4: Add Dialogue
- **Lipsync Node** (A2E) - Add dialogue to character with voice

### Step 5: Export/Share
- Download final video
- Submit to contest
- Share with community

## WHAT'S IMPLEMENTED ✅

### Canvas System
- ✅ Node-based UI (Freepik-style)
- ✅ Drawing tools (brush, eraser, etc.)
- ✅ Character reference slots (2 max)
- ✅ Environment selector
- ✅ Credit system
- ✅ Node types: character, scene, sketch, i2i, t2i, t2v, lipsync, action-pose

### API Routes
- ✅ `/api/a2e/character` - Character generation
- ✅ `/api/a2e/i2v` - Image-to-video (Wan 2.5)
- ✅ `/api/a2e/lipsync` - Dialogue/lipsync
- ✅ `/api/dzine/i2i` - Sketch to image
- ✅ `/api/runcomfy/preview` - Text-to-image preview
- ✅ `/api/runcomfy/sequence` - First+last frame interpolation
- ✅ `/api/runcomfy/i2v` - RunComfy i2v (alternative)
- ✅ `/api/runpod/scene-builder` - Scene composition
- ✅ `/api/fal/action-lora` - Action pose with LoRAs (just updated to use RunComfy)

### Trained LoRAs
- ✅ Punch LoRA - trained on FAL
- ✅ Kick LoRA - trained on FAL
- ✅ Takedown LoRA - trained on FAL (just completed)
- ✅ URLs fetched and mapped

### Database (Supabase)
- ✅ profiles
- ✅ character_references
- ✅ canvas_projects
- ✅ generated_outputs
- ✅ credit_transactions
- ✅ beta_signups
- ✅ scripts (Writers Room)
- ✅ presets
- ✅ contest_submissions
- ✅ contest_votes

## WHAT NEEDS WORK ⚠️

### 1. Action-Lora Deployment
- ⚠️ Need to download LoRA .safetensors files from FAL
- ⚠️ Upload to ComfyUI models/loras/ folder
- ⚠️ Deploy runcomfy-action-lora-workflow.json to RunComfy
- ⚠️ Add ACTION_LORA_WORKFLOW_ID to Vercel env vars
- ⚠️ Test all three poses (punch, kick, takedown)

### 2. Node Routing Issues
- ⚠️ t2v node routes to i2v API (mislabeled - should be i2v)
- ⚠️ No canvas node for sequence workflow (exists in API but not UI)
- ⚠️ Need to clarify: do we want sequence node OR node linking system?

### 3. Missing Features
- ⚠️ Face swap for character consistency across scenes
- ⚠️ Voice cloning integration
- ⚠️ Preset templates
- ⚠️ Export to video editor formats

### 4. Testing Needed
- ⚠️ Full end-to-end workflow (character → action → video → lipsync)
- ⚠️ Character reference system with @ tags
- ⚠️ Credit deduction and transactions
- ⚠️ Contest submission flow

## API INTEGRATIONS

### A2E.AI ($9.99/month)
- **Purpose:** Character generation, i2v, lipsync, face swap
- **Model:** Wan 2.5
- **Status:** ✅ Configured
- **Account:** AKTIONFILMAI
- **Endpoints Used:**
  - Character generation
  - Image-to-video (Wan 2.5)
  - Lipsync/dialogue

### RunComfy
- **Purpose:** Wan inpaint (sequence), custom workflows
- **Status:** ✅ Configured (API token + deployment ID set)
- **Workflows Needed:**
  - ⚠️ ACTION_LORA_WORKFLOW_ID (not set yet)
  - WAN_INPAINT_WORKFLOW_ID
  - WAN_2_2_WORKFLOW_ID

### RunPod Serverless
- **Purpose:** Scene builder (MickMumpitz workflow), custom img2vid
- **Status:** ⚠️ Partially configured
- **Workflows:** MickMumpitz Scene-Builder, QWEN uncensored model

### Dzine API
- **Purpose:** Sketch-to-image (i2i)
- **Status:** ✅ Configured and working

### FAL.ai
- **Purpose:** LoRA training (already completed)
- **Status:** ✅ 3 LoRAs trained, URLs fetched
- **Next:** Download and upload to ComfyUI

## DEPLOYMENT STATUS

### Vercel
- **URL:** vercel.com/egopanda/aktionfilmai
- **Status:** ✅ Deployed
- **Env Vars:** Most configured, need ACTION_LORA_WORKFLOW_ID

### Supabase
- **URL:** https://bqxxyqlbxyvfuanoiwyh.supabase.co
- **Status:** ✅ Database schema deployed
- **Storage:** character-refs bucket configured

### Local Dev
- **Status:** ✅ Running on localhost:3000
- **Hot reload:** Working
- **API routes:** All functional

## CREDIT COSTS (User Pricing)

| Node Type | Credits | $ Cost | Your Cost | Margin |
|-----------|---------|--------|-----------|--------|
| Character | 2 | $0.20 | ~$0.05 | 75% |
| Action Pose | 2 | $0.20 | TBD | TBD |
| Sketch | 1 | $0.10 | ~$0.01 | 90% |
| Scene Builder | 3 | $0.30 | ~$0.01 | 96% |
| i2i | 5 | $0.50 | ~$0.05 | 90% |
| t2i | 5 | $0.50 | ~$0.05 | 90% |
| i2v (A2E) | 8 | $0.80 | ~$0.02 | 97.5% |
| Lipsync | 3 | $0.30 | ~$0.10 | 66% |

## IMMEDIATE NEXT STEPS

1. ✅ Action LoRA integration updated to use RunComfy (DONE TODAY)
2. ⏳ Download LoRA files from FAL and upload to ComfyUI
3. ⏳ Deploy action-lora workflow to RunComfy
4. ⏳ Add env var to Vercel
5. ⏳ Test action pose generation with all 3 poses
6. ⏳ Decide on sequence node UI (separate node vs linking)
7. ⏳ Fix t2v/i2v labeling confusion
8. ⏳ Full workflow test: character → action pose → i2v → lipsync

## KEY WORKFLOWS TO SUPPORT

### Workflow 1: Simple Action Pose
```
1. Upload character ref
2. Action Pose node → draw sketch
3. Select pose (punch/kick/takedown)
4. Generate → LoRA-enhanced action image
```

### Workflow 2: Character Fight Scene
```
1. Upload 2 character refs (@hero, @villain)
2. Scene Builder → "fight scene" + warehouse environment
3. i2v → animate the fight
4. Download video
```

### Workflow 3: Dialogue Scene
```
1. Character node → generate hero
2. Lipsync node → "I'll be back" dialogue
3. i2v → animate with movement
4. Export
```

### Workflow 4: Frame Sequence
```
1. Create first frame (any method)
2. Create last frame (different pose/position)
3. Sequence node → interpolate between frames
4. Get smooth transition video
```

## NOTES

- Super admin user auto-logs in (id: 00000000-0000-0000-0000-000000000001)
- Character @ tags auto-replace with "name + outfit" in prompts
- Training opt-in gives users 10% off membership
- Contest: $10 first entry, $5 subsequent
- All A2E calls are uncensored (uncensored: true flag)
