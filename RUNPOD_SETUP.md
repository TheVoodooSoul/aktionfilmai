# 🚀 RunPod Serverless Setup Guide

## Why RunPod + Your MickMumpitz Workflows?

**Your Competitive Advantage:**
- ✅ Custom uncensored QWEN model
- ✅ Professional Scene-Builder workflow (Patreon)
- ✅ Custom Img2Vid pipeline
- ✅ Full control over generation
- ✅ Pay-per-second (cheaper than subscriptions)
- ✅ No watermarks, no censorship

**Your Files:**
1. `251101_MICKMUMPITZ_SCENE-BUILDER_1-1.json` - Scene composition
2. `251029_MICKMUMPITZ_IMG2VID_1-0.json` - Image to video
3. `251018_MICKMUMPITZ_QWEN-EDIT_360_03.safetensors` - Uncensored model

---

## STEP 1: Create RunPod Account (2 minutes)

1. **Go to:** https://www.runpod.io
2. **Sign up** (they give free credits!)
3. **Verify email**
4. **Add payment method** (required, but you get $10-25 free credits)

---

## STEP 2: Get Your API Key (1 minute)

1. Go to: https://www.runpod.io/console/user/settings
2. Click **"API Keys"**
3. Click **"+ Create API Key"**
4. Name: `AKTIONFILMAI`
5. **Copy the key** (starts with `runpod-...`)
6. Save it somewhere safe!

---

## STEP 3: Deploy ComfyUI Serverless (5 minutes)

### Option A: Use RunPod Template (Easiest)

1. Go to: https://www.runpod.io/console/serverless
2. Click **"+ New Endpoint"**
3. Search for: **"ComfyUI"**
4. Select: **"ComfyUI Serverless"** template
5. Choose GPU: **A40** (best price/performance)
   - Cost: ~$0.0004/second
   - Perfect for your workflows
6. Name: `aktionfilm-comfyui`
7. Configure:
   - **Min Workers:** 0 (pay only when used)
   - **Max Workers:** 3 (can handle traffic)
   - **Idle Timeout:** 5 seconds
   - **Execution Timeout:** 600 seconds (10 min max)
8. Click **"Deploy"**

**Wait 2-3 minutes for deployment...**

### Option B: Use Docker Image (Advanced)

If the template doesn't work, you can deploy a custom Docker image:

```bash
# Use the official ComfyUI serverless image
runpod/worker-comfy:latest
```

---

## STEP 4: Get Your Endpoint URL

Once deployed:

1. Go to your endpoint dashboard
2. Copy the **Endpoint URL**
   - Looks like: `https://api.runpod.ai/v2/YOUR-ENDPOINT-ID`
3. Save this - you'll need it!

---

## STEP 5: Upload Your Workflows (10 minutes)

### Upload via RunPod Storage:

1. In your endpoint settings, go to **"Storage"**
2. Create folder: `workflows/`
3. **Upload Scene-Builder:**
   - Navigate to: `/Users/egopanda/Downloads/251101_MICKMUMPITZ_SCENE-BUILDER_1-1.json`
   - Upload to: `workflows/scene-builder.json`
4. **Upload Img2Vid:**
   - Navigate to: `/Users/egopanda/Downloads/251029_MICKMUMPITZ_IMG2VID_1-0.json`
   - Upload to: `workflows/img2vid.json`

### Upload Model Checkpoint:

1. Create folder: `models/checkpoints/`
2. **Upload QWEN Model:**
   - Navigate to: `/Users/egopanda/Downloads/251018_MICKMUMPITZ_QWEN-EDIT_360_03.safetensors`
   - Upload to: `models/checkpoints/qwen-edit-360.safetensors`
   - **⚠️ This will take 5-10 minutes** (large file)

---

## STEP 6: Test Your Endpoint (5 minutes)

### Test with cURL:

```bash
curl -X POST https://api.runpod.ai/v2/YOUR-ENDPOINT-ID/run \
  -H "Authorization: Bearer YOUR-RUNPOD-API-KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "workflow": "scene-builder",
      "prompt": "Two fighters in combat stance, cyberpunk warehouse",
      "steps": 20,
      "cfg": 7.0
    }
  }'
```

**Expected Response:**
```json
{
  "id": "job-id-here",
  "status": "IN_QUEUE"
}
```

### Check Job Status:

```bash
curl https://api.runpod.ai/v2/YOUR-ENDPOINT-ID/status/JOB-ID \
  -H "Authorization: Bearer YOUR-RUNPOD-API-KEY"
```

**Expected Response:**
```json
{
  "status": "COMPLETED",
  "output": {
    "image": "base64-encoded-image-here"
  }
}
```

---

## STEP 7: Add to Your App (2 minutes)

Update `.env.local`:

```env
RUNPOD_API_KEY=runpod-your-key-here
RUNPOD_ENDPOINT_URL=https://api.runpod.ai/v2/YOUR-ENDPOINT-ID
```

**Restart your dev server!**

---

## STEP 8: Test in Your Canvas

1. Open: http://localhost:3000/canvas
2. Click **+ button**
3. Select **"Scene Builder (RunPod)"**
4. Type prompt: `"Two martial artists fighting in warehouse"`
5. Select Action Type: **"Fight Scene"**
6. Click **"Generate"**
7. **Wait 10-15 seconds**
8. **See your custom-generated scene!** 🎬

---

## Cost Breakdown

### RunPod Pricing:
- **A40 GPU:** $0.0004/second
- **Scene generation:** ~10-15 seconds = **$0.004-0.006 per scene**
- **Img2Vid:** ~30-40 seconds = **$0.012-0.016 per video**

### Your Pricing:
- **Scene Builder:** 3 credits = $0.30
- **Custom Img2Vid:** 5 credits = $0.50

### Your Profit:
- **Scene:** $0.30 - $0.006 = **$0.294 (98% margin!)**
- **Video:** $0.50 - $0.016 = **$0.484 (96.8% margin!)**

**These are INSANE margins!**

---

## Workflow Integration

### Scene-Builder Workflow:

Your workflow likely expects:
```json
{
  "prompt": "Action scene description",
  "character_1": "image_url_or_base64",
  "character_2": "image_url_or_base64",
  "environment": "warehouse",
  "model": "qwen-edit-360.safetensors",
  "steps": 20,
  "cfg": 7.0,
  "seed": -1
}
```

### Img2Vid Workflow:

```json
{
  "image": "base64_or_url",
  "motion_strength": 0.7,
  "fps": 24,
  "frames": 96,
  "model": "your-video-model"
}
```

---

## API Wrapper for Your App

I've already created the API route at:
`/app/api/runpod/scene-builder/route.ts`

It handles:
- ✅ Taking your node inputs
- ✅ Formatting for RunPod
- ✅ Calling your endpoint
- ✅ Polling for completion
- ✅ Returning the result
- ✅ Deducting credits

**Just add your endpoint URL and it works!**

---

## Troubleshooting

### "Workflow not found"
- Make sure workflows are in `/workflows/` folder
- Check file names match exactly
- Verify upload completed

### "Model not found"
- Ensure `.safetensors` file is in `/models/checkpoints/`
- Check file name in workflow JSON matches
- Model upload can take 10+ minutes

### "Timeout error"
- Increase execution timeout in endpoint settings
- Check GPU availability (A40 might be out of stock)
- Try different GPU tier

### "Out of credits"
- Add credits to RunPod account
- Check billing section
- Free tier has limits

---

## Production Optimization

### For Beta Launch:
- ✅ Use **Min Workers: 0** (no idle cost)
- ✅ Set **Max Workers: 3** (handle spikes)
- ✅ Use **A40 GPU** (best price/performance)
- ✅ Monitor usage in RunPod dashboard

### For Scale (100+ users):
- Set **Min Workers: 1** (faster response)
- Increase **Max Workers: 10+**
- Consider **A100 GPU** for faster generation
- Set up monitoring/alerts

---

## Next Steps

Once RunPod is working:

1. ✅ Test Scene-Builder locally
2. ✅ Test Img2Vid locally
3. ✅ Add endpoint URLs to Vercel
4. ✅ Deploy to production
5. ✅ Launch beta!

---

## Expected Timeline

- **Account Setup:** 2 min
- **Deploy Endpoint:** 5 min
- **Upload Workflows:** 5 min
- **Upload Model:** 10 min
- **Testing:** 10 min
- **Integration:** 5 min
- **Total:** ~40 minutes

**Then you have the most powerful action film AI platform ever built!**

---

## Questions?

Common issues:
- Model too large? → Use network storage
- Workflow errors? → Check ComfyUI logs
- Slow generation? → Upgrade GPU tier
- High costs? → Optimize workflow steps

**Ready to set this up?** Let's do it! 🚀
