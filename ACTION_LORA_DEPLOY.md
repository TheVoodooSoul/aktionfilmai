# Action LoRA Deployment - Step by Step

## Quick Overview
You need to:
1. Download 3 LoRA files from FAL
2. Upload them to ComfyUI
3. Import workflow JSON to RunComfy
4. Add workflow ID to Vercel

---

## Step 1: Download LoRAs from FAL

Download these 3 files:

**Punch LoRA:**
```
URL: https://v3.fal.media/files/zebra/-x8yySPU3oiXHfqjG_wtN_adapter_model.safetensors
Save as: punch_wan22.safetensors
```

**Kick LoRA:**
```
URL: https://v3.fal.media/files/rabbit/wHyoYJLx1pYifFifUNRV3_adapter_model.safetensors
Save as: kick_wan22.safetensors
```

**Takedown LoRA:**
```
URL: https://v3b.fal.media/files/b/koala/91oSdDegjvEh4C0nEwXkA_adapter_model.safetensors
Save as: takedown_wan22.safetensors
```

**Quick download script (Mac/Linux):**
```bash
cd ~/Downloads
curl -o punch_wan22.safetensors "https://v3.fal.media/files/zebra/-x8yySPU3oiXHfqjG_wtN_adapter_model.safetensors"
curl -o kick_wan22.safetensors "https://v3.fal.media/files/rabbit/wHyoYJLx1pYifFifUNRV3_adapter_model.safetensors"
curl -o takedown_wan22.safetensors "https://v3b.fal.media/files/b/koala/91oSdDegjvEh4C0nEwXkA_adapter_model.safetensors"
```

---

## Step 2: Upload to ComfyUI

1. Access your ComfyUI server
2. Navigate to: `/models/loras/` directory
3. Upload all 3 files:
   - punch_wan22.safetensors
   - kick_wan22.safetensors
   - takedown_wan22.safetensors

**Via command line:**
```bash
# If you have SSH access to your ComfyUI server
scp punch_wan22.safetensors user@comfyui-server:/path/to/ComfyUI/models/loras/
scp kick_wan22.safetensors user@comfyui-server:/path/to/ComfyUI/models/loras/
scp takedown_wan22.safetensors user@comfyui-server:/path/to/ComfyUI/models/loras/
```

---

## Step 3: Deploy to RunComfy

1. **Go to RunComfy dashboard:** https://www.runcomfy.com/
2. **Import workflow:**
   - Click "Create New Workflow"
   - Import this file: `workflows/action-lora-runcomfy-READY.json`
   - Or copy/paste the JSON content
3. **Verify nodes:**
   - Make sure LoRA files are detected
   - Check that control_v11p_sd15_scribble.pth is available
   - Verify v1-5-pruned-emaonly.safetensors checkpoint exists
4. **Save and deploy**
5. **Copy the Workflow ID** (looks like: `wf_abc123xyz`)

---

## Step 4: Add to Vercel

1. Go to: https://vercel.com/egopanda/aktionfilmai/settings/environment-variables
2. Add new environment variable:
   ```
   Name: ACTION_LORA_WORKFLOW_ID
   Value: wf_abc123xyz (your actual workflow ID)
   Environment: Production, Preview, Development
   ```
3. Click "Save"
4. Redeploy the app (or it will auto-deploy)

---

## Step 5: Test It

1. Go to canvas: http://localhost:3000/canvas
2. Login as: test@aktionfilm.ai / test123456
3. Click + button → Action Pose 🥋
4. Draw a sketch
5. Select action type (punch/kick/takedown)
6. Click Generate
7. Wait ~30 seconds
8. Should get LoRA-enhanced action pose image

---

## Troubleshooting

**"LoRA file not found"**
- Make sure LoRA files are in ComfyUI's `models/loras/` folder
- Check filenames match exactly: punch_wan22.safetensors, etc.

**"Checkpoint not found"**
- Download v1-5-pruned-emaonly.safetensors
- Place in ComfyUI's `models/checkpoints/` folder

**"ControlNet not found"**
- Download control_v11p_sd15_scribble.pth
- Place in ComfyUI's `models/controlnet/` folder

**"Workflow ID not set"**
- Check Vercel environment variables
- Make sure ACTION_LORA_WORKFLOW_ID is set
- Redeploy the app

---

## Required Files Summary

**In ComfyUI `/models/loras/`:**
- punch_wan22.safetensors
- kick_wan22.safetensors
- takedown_wan22.safetensors

**In ComfyUI `/models/checkpoints/`:**
- v1-5-pruned-emaonly.safetensors

**In ComfyUI `/models/controlnet/`:**
- control_v11p_sd15_scribble.pth

**In Vercel:**
- ACTION_LORA_WORKFLOW_ID environment variable
