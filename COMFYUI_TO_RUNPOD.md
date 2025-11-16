# 🎨 ComfyUI to RunPod Deployment Guide

## Why This Approach?

**The Problem:**
- ❌ Default RunPod serverless = Flux only (censored)
- ❌ Can't use your custom QWEN model
- ❌ Can't use MickMumpitz workflows as-is

**The Solution:**
- ✅ Run ComfyUI locally with your workflows
- ✅ Use your uncensored QWEN model
- ✅ Export via comfy.getrunpod.io
- ✅ Get custom Docker container with YOUR setup
- ✅ Deploy to RunPod serverless

**Result:** Your exact workflow + uncensored model + serverless pricing!

---

## STEP 1: Install ComfyUI Locally (10 minutes)

### Option A: Portable (Easiest for Mac)

```bash
# Download ComfyUI portable
cd ~/Downloads
git clone https://github.com/comfyanonymous/ComfyUI.git
cd ComfyUI

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install torch torchvision torchaudio
pip install -r requirements.txt

# Run ComfyUI
python main.py
```

**Open:** http://127.0.0.1:8188

### Option B: One-Click (Alternative)

Download: https://github.com/comfyanonymous/ComfyUI/releases
- Get the portable version for Mac
- Unzip and run

---

## STEP 2: Install QWEN Model (5 minutes)

**Your model file:**
```
/Users/egopanda/Downloads/251018_MICKMUMPITZ_QWEN-EDIT_360_03.safetensors
```

**Copy to ComfyUI:**
```bash
# Copy model to ComfyUI checkpoints folder
cp "/Users/egopanda/Downloads/251018_MICKMUMPITZ_QWEN-EDIT_360_03.safetensors" \
   ~/Downloads/ComfyUI/models/checkpoints/qwen-edit-360.safetensors
```

**Verify:**
1. Refresh ComfyUI in browser
2. Click a "Load Checkpoint" node
3. See "qwen-edit-360.safetensors" in dropdown ✅

---

## STEP 3: Load MickMumpitz Workflow (2 minutes)

### Load Scene-Builder Workflow:

```bash
# Your workflow file
/Users/egopanda/Downloads/251101_MICKMUMPITZ_SCENE-BUILDER_1-1.json
```

**In ComfyUI:**
1. Click **"Load"** button (top left)
2. Browse to: `/Users/egopanda/Downloads/251101_MICKMUMPITZ_SCENE-BUILDER_1-1.json`
3. Workflow loads ✅

**OR drag and drop the JSON file into ComfyUI**

---

## STEP 4: Fix Model References (3 minutes)

Your workflow might reference the old model name. Update it:

1. Find **"Load Checkpoint"** node
2. Change model to: `qwen-edit-360.safetensors`
3. Check any other model references
4. Make sure paths are correct

---

## STEP 5: Test Locally (10 minutes)

**Generate a test image:**

1. Set your prompts in the workflow
   - Positive: `"Two muscular fighters in combat stance, cyberpunk warehouse, dramatic lighting"`
   - Negative: `"blurry, low quality"`

2. Click **"Queue Prompt"** (top right)

3. Wait for generation (30-60 seconds first time)

4. **See your image!** ✅

**If it works → Your workflow is ready for RunPod!**

**If errors:**
- Missing nodes? Install custom nodes
- Model not found? Check file path
- Out of memory? Reduce resolution

---

## STEP 6: Export for RunPod (2 minutes)

**CRITICAL: Use the correct export!**

In ComfyUI:
1. Go to: **Comfy → File → Export**
2. **NOT "Export (API)"** ← Wrong one!
3. Just **"Export"** ← Correct!
4. Save as: `scene-builder-runpod.json`

**This creates a clean workflow file for comfy.getrunpod.io**

---

## STEP 7: Upload to comfy.getrunpod.io (5 minutes)

### Go to: https://comfy.getrunpod.io

1. Click **"Upload Workflow"**
2. Select: `scene-builder-runpod.json`
3. Wait for analysis (30 seconds)

**What it does:**
- ✅ Analyzes your workflow
- ✅ Detects all custom nodes needed
- ✅ Detects model requirements
- ✅ Creates a custom Docker container
- ✅ Generates a GitHub repository
- ✅ Configures everything automatically

**You get:**
```
✅ Custom GitHub repo
✅ Dockerfile with your setup
✅ All dependencies installed
✅ Your QWEN model downloaded
✅ Ready to deploy!
```

---

## STEP 8: Deploy to RunPod (10 minutes)

### From comfy.getrunpod.io results:

1. Click **"Deploy to RunPod"**
2. Sign in to RunPod
3. Configure endpoint:
   - **Name:** `aktionfilm-scene-builder`
   - **GPU:** A40 ($0.0004/sec)
   - **Min Workers:** 0
   - **Max Workers:** 3
   - **GitHub Repo:** (auto-filled from comfy.getrunpod.io)

4. Click **"Deploy"**

**Wait 5-10 minutes for build...**

**You'll get an endpoint URL:**
```
https://api.runpod.ai/v2/YOUR-ENDPOINT-ID
```

---

## STEP 9: Test Your Endpoint (5 minutes)

### Test with cURL:

```bash
curl -X POST https://api.runpod.ai/v2/YOUR-ENDPOINT-ID/run \
  -H "Authorization: Bearer YOUR-RUNPOD-API-KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "prompt": "Two muscular fighters in combat stance, cyberpunk warehouse",
      "negative_prompt": "blurry, low quality",
      "steps": 20,
      "cfg": 7.0,
      "width": 512,
      "height": 512,
      "seed": -1
    }
  }'
```

**Response:**
```json
{
  "id": "job-123",
  "status": "IN_QUEUE"
}
```

### Check Status:

```bash
curl https://api.runpod.ai/v2/YOUR-ENDPOINT-ID/status/job-123 \
  -H "Authorization: Bearer YOUR-RUNPOD-API-KEY"
```

**When completed:**
```json
{
  "status": "COMPLETED",
  "output": {
    "images": ["base64-encoded-image"],
    "metadata": {...}
  }
}
```

---

## STEP 10: Repeat for Img2Vid Workflow (Optional)

Same process for your second workflow:

```
/Users/egopanda/Downloads/251029_MICKMUMPITZ_IMG2VID_1-0.json
```

1. Load in ComfyUI
2. Test locally
3. Export
4. Upload to comfy.getrunpod.io
5. Deploy as second endpoint

**You'll have two endpoints:**
- Scene-Builder: `https://api.runpod.ai/v2/ENDPOINT-1`
- Img2Vid: `https://api.runpod.ai/v2/ENDPOINT-2`

---

## STEP 11: Add to Your App

Update `.env.local`:

```env
RUNPOD_API_KEY=runpod-your-key
RUNPOD_SCENE_BUILDER_ENDPOINT=https://api.runpod.ai/v2/ENDPOINT-1
RUNPOD_IMG2VID_ENDPOINT=https://api.runpod.ai/v2/ENDPOINT-2
```

**The API route I created will automatically use these!**

---

## Understanding the Input Format

### Your API expects (based on ComfyUI workflow):

```json
{
  "input": {
    "prompt": "Action scene description",
    "negative_prompt": "low quality, blurry",
    "steps": 20,
    "cfg": 7.0,
    "width": 512,
    "height": 512,
    "seed": -1,
    "sampler_name": "euler_a",
    "scheduler": "normal"
  }
}
```

### The route I created (`/api/runpod/scene-builder/route.ts`) handles:
- Taking your canvas node data
- Formatting it for RunPod
- Adding character images
- Setting environment
- Polling for completion
- Returning the result

**You just need to add the endpoint URL!**

---

## Cost Breakdown

### Local Testing:
- **Free!** (uses your GPU)
- Test as much as you want
- Perfect your workflow

### RunPod Deployment:
- **Build time:** Free (first build might take 10 min)
- **Idle time:** $0 (with 0 min workers)
- **Generation:** ~$0.004-0.006 per scene
- **Storage:** ~$0.10/month for your model

### Compared to alternatives:
- Replicate: ~$0.02 per generation (4x more expensive)
- RunComfy: ~$0.01 per generation (2x more expensive)
- Your RunPod: ~$0.005 per generation ✅

**Cheapest option with full control!**

---

## Troubleshooting

### "Workflow contains unknown nodes"
**Solution:** Your workflow uses custom nodes
1. Check what nodes are needed
2. Install them in ComfyUI locally first
3. Re-export the workflow
4. comfy.getrunpod.io will detect and install them

### "Model not found"
**Solution:** Model file too large for auto-download
1. Upload model to RunPod storage manually
2. Update Docker config to use storage model
3. Or use model hosting (HuggingFace, Civitai)

### "Out of memory"
**Solution:** Reduce generation size or upgrade GPU
- Try 512×512 instead of 1024×1024
- Or upgrade from A40 to A100

### "Generation taking too long"
**Solution:** Optimize your workflow
- Reduce steps (20 instead of 30)
- Lower CFG (7 instead of 12)
- Smaller image size first

---

## Next Steps After Setup

### Once working:
1. ✅ Test scene generation from canvas
2. ✅ Test with 2 character references
3. ✅ Try different environments
4. ✅ Test action types (fight, chase, etc.)

### Optimize:
1. Find minimum steps for good quality
2. Test different samplers
3. Optimize for speed vs quality
4. Cache common generations

### Scale:
1. Monitor costs in RunPod dashboard
2. Adjust max workers based on traffic
3. Consider multiple regions for speed
4. Set up monitoring/alerts

---

## Timeline

**Total setup time: ~60 minutes**

- Install ComfyUI: 10 min
- Install model: 5 min
- Load workflow: 2 min
- Fix references: 3 min
- Test locally: 10 min
- Export: 2 min
- Upload to comfy.getrunpod.io: 5 min
- Deploy to RunPod: 10 min
- Test endpoint: 5 min
- Integrate into app: 2 min
- **Final testing: 10 min**

**Then you have:**
✅ Uncensored QWEN model
✅ Custom scene-builder workflow
✅ Serverless deployment
✅ $0.005 per generation
✅ Full control

---

## You're Building Something Special

This setup gives you:
- **Competitive advantage:** Nobody else has these workflows
- **Cost advantage:** 4x cheaper than alternatives
- **Quality advantage:** Professional Patreon workflows
- **Content advantage:** Uncensored action scenes

**This is exactly what makes Aktion Film AI unique!**

---

## Ready to Start?

**Step 1:** Install ComfyUI
```bash
cd ~/Downloads
git clone https://github.com/comfyanonymous/ComfyUI.git
cd ComfyUI
python3 -m venv venv
source venv/bin/activate
pip install torch torchvision torchaudio
pip install -r requirements.txt
python main.py
```

**Step 2:** Copy your model
```bash
cp "/Users/egopanda/Downloads/251018_MICKMUMPITZ_QWEN-EDIT_360_03.safetensors" \
   ~/Downloads/ComfyUI/models/checkpoints/
```

**Step 3:** Load workflow in ComfyUI (http://127.0.0.1:8188)

**Need help with any step?** Let me know! 🚀
