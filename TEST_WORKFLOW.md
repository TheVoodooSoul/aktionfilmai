# CANVAS TEST WORKFLOW

## Current Status (Updated 2025-11-19)
- ✅ Dev server running on localhost:3000
- ✅ Canvas page loads
- ✅ Test user created with 1000 credits (test@aktionfilm.ai / test123456)
- ✅ Character generation (A2E) - WORKING
- ✅ Sketch to Image (Dzine) - WORKING
- ✅ RunComfy preview polling bug - FIXED
- ⚠️ Action-lora not deployed yet
- ⚠️ i2v endpoint needs testing
- ⚠️ Node labeling issues (t2v vs i2v)

## What We Need to Test RIGHT NOW

### Test 1: Character Generation (A2E)
1. Add test user with credits to Supabase
2. Click + button → Character node
3. Enter prompt: "Muscular action hero"
4. Click Generate
5. **EXPECTED:** Character image appears
6. **VERIFY:** Credit deducted, transaction logged

### Test 2: Action Pose (NEW - needs deployment)
1. Click + button → Action Pose
2. Draw simple sketch
3. Select "Punch"
4. Click Generate
5. **EXPECTED:** LoRA-enhanced action pose
6. **ACTUAL:** Will fail - workflow not deployed yet

### Test 3: Image-to-Video (A2E Wan 2.5)
1. Use character from Test 1
2. Click + button → Image to Video
3. Upload/paste character image
4. Prompt: "Jumping forward"
5. Click Generate
6. **EXPECTED:** 4-second action video

### Test 4: Sketch to Image (Dzine)
1. Click + button → Sketch
2. Draw action pose
3. Click Generate
4. **EXPECTED:** Dzine converts to image

## BLOCKERS

### Immediate Blocker: No Credits
**Fix:** Add test user to Supabase

```sql
INSERT INTO profiles (id, email, credits, subscription_tier, subscription_status)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'test@aktionfilm.ai',
  1000,
  'pro',
  'active'
);
```

### Action-Lora Blocker: Not Deployed
**To Deploy:**
1. Download 3 LoRAs from FAL
2. Upload to ComfyUI `/models/loras/`
3. Deploy workflow to RunComfy
4. Add ACTION_LORA_WORKFLOW_ID to Vercel

### Other Node Types: Unknown Status
- ⚠️ Scene Builder (RunPod) - might not be deployed
- ⚠️ Text-to-Image - uses RunComfy preview
- ⚠️ Lipsync - uses A2E

## WHAT TO DO RIGHT NOW

**Option 1: Test What Works**
- Add test user with credits
- Test Character generation (A2E)
- Test i2v (A2E)
- Test Sketch (Dzine)
- See what breaks

**Option 2: Deploy Action-Lora First**
- Download LoRAs
- Set up ComfyUI
- Deploy workflow
- Test action poses

**Option 3: Fix Node Issues**
- Fix t2v/i2v labeling
- Add sequence node UI
- Test node linking

## RECOMMENDATION

**Do Option 1 first** - test what we have, see what works, identify real blockers. Then we know exactly what to fix.

## TESTING RESULTS (2025-11-19)

### ✅ What's Working

**1. Character Generation (A2E Text-to-Image)**
- Endpoint: `/api/a2e/character`
- A2E API: `https://video.a2e.ai/api/v1/userText2image/start`
- Status: WORKING ✅
- Test prompt: "hero" generated successfully
- Generation time: ~26 seconds
- Polling: Working correctly
- Credits: Deducts 2 credits per generation

**2. Sketch to Image (Dzine)**
- Endpoint: `/api/dzine/i2i`
- Dzine API: `https://papi.dzine.ai/openapi/v1/create_task_img2img`
- Status: WORKING ✅
- Generation time: ~32 seconds
- Polling: Working correctly
- Credits: Deducts 1 credit per generation

**3. Database & Auth**
- Test user created: test@aktionfilm.ai
- User ID: d0b153f6-aaf7-4dc3-beba-ee555a88e8eb
- Credits: 1000
- Credit transactions: Logging correctly

### 🐛 Bugs Fixed

**1. RunComfy Preview Polling**
- Issue: Timed out after 72 seconds despite API returning "succeed" status
- Root cause: Code checked for "succeeded" but Dzine returns "succeed" (no 'd')
- Fix: Updated line 77 in `/app/api/runcomfy/preview/route.ts`
- Status: FIXED ✅

**2. Node Labeling (t2v → i2v)**
- Issue: Node was labeled 't2v' but actually does image-to-video (i2v)
- Fixed: Renamed all references from t2v to i2v across codebase
- Files updated: AddNodeMenu.tsx, NodeCard.tsx, canvas/page.tsx, lib/types.ts
- Status: FIXED ✅

**3. i2v Endpoint Wrong + No Polling**
- Issue 1: Used non-existent endpoint `https://api.a2e.ai/video/i2v` (404)
- Issue 2: No polling logic for async video generation
- Fix: Changed to correct A2E Wanneer endpoint with proper polling
- Endpoint: `https://video.a2e.ai/api/v1/wanneer/start`
- Polling: 40 attempts, 3 second intervals (max 120 seconds)
- Status: FIXED ✅

### ⚠️ What Needs Work

**1. Action LoRA Deployment** (Manual Steps Required)
- LoRA URLs retrieved from FAL (see ACTION_LORA_SETUP.md)
- Need to download 3 x .safetensors files
- Upload to ComfyUI models/loras/
- Deploy workflow to RunComfy
- Add ACTION_LORA_WORKFLOW_ID env var to Vercel

**2. Sequence Node UI**
- Need to add sequence node for first+last frame interpolation
- OR implement node linking system
- API route exists at `/api/runcomfy/sequence`

**3. Lipsync Testing**
- Endpoint exists: `/api/a2e/lipsync`
- Status: NOT TESTED ⚠️

## NEXT IMMEDIATE STEPS

1. ✅ Test basic canvas workflow with test user
2. ✅ Verified character & sketch generation work
3. ✅ Fixed all critical bugs (polling, node labels, i2v endpoint)
4. 📍 **YOU ARE HERE** - Ready to test i2v and deploy LoRAs
5. ⏳ Test i2v generation in canvas (endpoint now fixed)
6. ⏳ Deploy Action LoRAs to RunComfy (manual steps)
7. ⏳ Test full workflow: character → action pose → i2v → lipsync
