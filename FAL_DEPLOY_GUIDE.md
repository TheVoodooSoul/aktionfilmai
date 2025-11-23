# Deploy Action LoRA to FAL - Easy Guide

## Why FAL?
- ✅ Your LoRAs are already on FAL
- ✅ Upload workflow JSON → Get instant API endpoint
- ✅ No ComfyUI setup needed
- ✅ FAL_API_KEY already configured

---

## Step 1: Deploy Workflow to FAL

1. **Go to:** https://fal.ai/dashboard

2. **Click:** "Deploy" → "ComfyUI Workflow"

3. **Upload:** `RUNCOMFY_ACTION_LORA.json`

4. **Configure:**
   - Name: "Action LoRA - Punch/Kick/Takedown"
   - Make sure to link your trained LoRAs:
     - punch_wan22 (from training ID: 8f3e6312-b259-4e85-bd54-c218f856cf2e)
     - kick_wan22 (from training ID: 7bd6fdea-fd83-406d-9098-b1d8d83be0cf)
     - takedown_wan22 (from training ID: 34018947-23d9-48c2-8879-442c016ac4b9)

5. **Deploy** - FAL will give you a workflow ID like: `comfy/abc123-xyz789`

6. **Copy the workflow ID**

---

## Step 2: Add to Vercel

Add this environment variable:

```bash
FAL_ACTION_LORA_WORKFLOW_ID=comfy/abc123-xyz789
```

Go to: https://vercel.com/egopanda/aktionfilmai/settings/environment-variables

---

## Step 3: Test It!

1. Go to canvas: http://localhost:3000/canvas
2. Click + → Action Pose 🥋
3. Draw a sketch
4. Select Punch/Kick/Takedown
5. Generate

---

## How It Works

**Your API route now calls FAL:**
```
POST https://queue.fal.run/fal-ai/comfy/YOUR-WORKFLOW-ID
```

**With dynamic inputs:**
- SKETCH_IMAGE: Your drawing (base64)
- LORA_NAME: punch_wan22.safetensors / kick_wan22.safetensors / takedown_wan22.safetensors
- PROMPT: Your description
- RANDOM_SEED: Random number

**One workflow = All 3 LoRAs** ✅

---

## Troubleshooting

**"Workflow not found"**
- Check FAL_ACTION_LORA_WORKFLOW_ID in Vercel
- Make sure format is: `comfy/abc123-xyz789`

**"LoRA not found"**
- In FAL dashboard, link your trained LoRA models to the workflow
- Use the training IDs listed above

**"Generation failed"**
- Check FAL dashboard logs
- Verify all 3 LoRAs are linked to the workflow
- Test with one LoRA first (punch)

---

## Advantages Over RunComfy

| Feature | FAL | RunComfy |
|---------|-----|----------|
| LoRAs | Already there ✅ | Need to upload |
| Setup | Upload JSON ✅ | Manual node setup |
| API | Auto-created ✅ | Need workflow ID |
| Cost | Pay as you go | Subscription |

---

## Next Steps After Deploy

1. Test punch pose first
2. If works, test kick
3. Then test takedown
4. Adjust LoRA strength if needed (currently 0.8)

All set! Just upload to FAL and add the workflow ID to Vercel.
