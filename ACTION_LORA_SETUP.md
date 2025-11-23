# Action LoRA Setup Guide

## Overview
This guide explains how to complete the Action LoRA integration for AktionFilmAI using your trained Wan LoRAs.

## What's Already Done ✅
- ✅ Created "Action Pose" node type in the canvas
- ✅ Updated API route to use RunComfy (`/api/fal/action-lora`)
- ✅ LoRA file name mapping configured:
  - `punch` → `punch_wan22.safetensors`
  - `kick` → `kick_wan22.safetensors`
  - `takedown` → `takedown_wan22.safetensors`
- ✅ ComfyUI workflow JSON ready (`runcomfy-action-lora-workflow.json`)

## What You Need to Do 🚀

### 1. Download Your Trained LoRAs from FAL

Go to your FAL dashboard and download the three trained LoRA files:

**Punch LoRA:**
- Training ID: `8f3e6312-b259-4e85-bd54-c218f856cf2e`
- File URL: `https://v3.fal.media/files/zebra/-x8yySPU3oiXHfqjG_wtN_adapter_model.safetensors`
- Download and rename to: `punch_wan22.safetensors`

**Kick LoRA:**
- Training ID: `7bd6fdea-fd83-406d-9098-b1d8d83be0cf`
- File URL: `https://v3.fal.media/files/rabbit/wHyoYJLx1pYifFifUNRV3_adapter_model.safetensors`
- Download and rename to: `kick_wan22.safetensors`

**Takedown LoRA:**
- Training ID: `34018947-23d9-48c2-8879-442c016ac4b9`
- File URL: `https://v3b.fal.media/files/b/koala/91oSdDegjvEh4C0nEwXkA_adapter_model.safetensors`
- Download and rename to: `takedown_wan22.safetensors`

### 2. Upload LoRAs to ComfyUI

Upload the three renamed `.safetensors` files to your ComfyUI instance in the `models/loras/` directory.

### 3. Deploy Workflow to RunComfy

1. Go to your RunComfy dashboard
2. Create a new workflow using `runcomfy-action-lora-workflow.json`
3. Copy the workflow ID

### 4. Add Environment Variable to Vercel

Add this environment variable in your Vercel project settings:

```bash
ACTION_LORA_WORKFLOW_ID=<your-workflow-id-from-runcomfy>
```

### 5. Test It!

1. Go to your deployed app on Vercel
2. Navigate to the Canvas page
3. Click the + button and select "Action Pose" (🥋)
4. Draw a sketch of an action pose
5. Select the action type (Punch, Kick, or Takedown)
6. Hit Generate!

## Workflow Schema

The workflow accepts these inputs:
- `SKETCH_IMAGE` - Your drawn sketch (base64)
- `PROMPT` - Optional description
- `ACTION_TYPE` - punch, kick, or takedown
- `LORA_NAME` - Auto-selected based on ACTION_TYPE
- `RANDOM_SEED` - Auto-generated

## LoRA Configuration

The LoRAs are loaded in ComfyUI with:
- **Model Strength**: 0.8
- **CLIP Strength**: 0.8
- **Base Model**: v1-5-pruned-emaonly.safetensors
- **ControlNet**: control_v11p_sd15_scribble.pth (for sketch guidance)

## Credits

Action Pose generation costs **2 credits** per generation.

## Troubleshooting

If you get errors:
1. Check that all three LoRA files are in ComfyUI's `models/loras/` folder
2. Verify the ACTION_LORA_WORKFLOW_ID is set in Vercel
3. Check that RUNCOMFY_API_TOKEN and RUNCOMFY_DEPLOYMENT_ID are still valid
4. Look at Vercel function logs for detailed error messages
