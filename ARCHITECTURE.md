# Aktion Film AI - Technical Architecture

## Hybrid API Strategy

### A2E.AI Integration ($9.99/month)
**Use Cases:**
- Character avatar generation (uncensored)
- Character consistency via face swap
- Image-to-video (Wan 2.5)
- Lipsync for dialogue scenes
- Voice cloning (50+ languages)

**API Endpoints:**
```
POST /api/a2e/character - Generate character avatar
POST /api/a2e/i2v - Image to video (Wan 2.5)
POST /api/a2e/faceswap - Maintain character consistency
POST /api/a2e/lipsync - Add dialogue to scenes
```

### RunPod Serverless (Pay-per-use)
**Use Cases:**
- Scene composition (MickMumpitz Scene-Builder workflow)
- Custom violence/action generation (QWEN model)
- Specialized img2vid pipeline (MickMumpitz workflow)
- Custom frame interpolation

**Workflows:**
- `251101_MICKMUMPITZ_SCENE-BUILDER_1-1.json` - Scene composition
- `251029_MICKMUMPITZ_IMG2VID_1-0.json` - Custom img2vid
- `251018_MICKMUMPITZ_QWEN-EDIT_360_03.safetensors` - Uncensored model

---

## Canvas Node Types

### 1. **Character Node** (A2E.AI)
- Generate uncensored character avatar
- Upload reference image OR generate from description
- Output: Consistent character for scene

### 2. **Sketch Node** (Current)
- Draw action pose/scene
- Convert to image

### 3. **Scene Builder Node** (RunPod + MickMumpitz)
- Compose complete action scene
- Combine characters + environment + action
- Uses Scene-Builder workflow

### 4. **Text to Image** (A2E.AI or RunPod)
- Generate from prompt
- Option to use QWEN model for violence

### 5. **Image to Video** (A2E.AI Wan 2.5 OR RunPod Custom)
- A2E.AI: Fast, reliable (Wan 2.5)
- RunPod: Custom pipeline for specific effects

### 6. **Lipsync Node** (A2E.AI)
- Add dialogue to character
- Voice cloning option
- Upload audio or text-to-speech

### 7. **Face Swap Node** (A2E.AI)
- Maintain character consistency
- Swap face across multiple scenes
- Keep same character in all shots

---

## Workflow Examples

### Workflow 1: Simple Character Fight
```
Character Node (A2E) → Scene Builder (RunPod) → I2V (A2E Wan 2.5)
```

### Workflow 2: Dialogue + Action
```
Character Node (A2E) → Lipsync Node (A2E) → Scene Builder (RunPod) → I2V
```

### Workflow 3: Multi-Scene Sequence
```
Scene 1 (RunPod) → Face Swap (A2E) → Scene 2 (RunPod) → I2V (RunPod Custom)
```

---

## API Cost Breakdown

### A2E.AI Pricing
- **Starter Plan:** $9.99/month
- **Pay-as-you-go:** Available
- **SLA:** 99.99% uptime

**When to use A2E:**
- Need character consistency
- Need dialogue/lipsync
- Quick i2v (Wan 2.5)
- Reliable production endpoint

### RunPod Serverless Pricing
- **Pay per second** GPU usage
- **No monthly fee**
- **Typical cost:** $0.0004/sec on A40 GPU

**When to use RunPod:**
- Custom workflows
- Uncensored violence/action
- Specialized effects
- Full control needed

**Example costs:**
- Scene Builder: ~10 seconds = $0.004
- Img2Vid: ~30 seconds = $0.012
- Much cheaper than subscription APIs

---

## Implementation Priority

### Phase 1: A2E.AI Setup (Quick Win)
1. Get A2E.AI API key
2. Add to .env.local
3. Create character generation endpoint
4. Add A2E node types to canvas
5. Test character generation + i2v

**Time:** 1-2 hours
**Benefit:** Immediate uncensored character gen + i2v

### Phase 2: RunPod Setup (Custom Power)
1. Create RunPod account
2. Deploy ComfyUI serverless endpoint
3. Upload MickMumpitz workflows
4. Upload QWEN model checkpoint
5. Create API wrapper
6. Integrate into canvas

**Time:** 2-4 hours
**Benefit:** Custom workflows, full control, uncensored

### Phase 3: Integration
1. Add all node types to canvas
2. Create workflow templates
3. Test character consistency across nodes
4. Optimize for speed

---

## Environment Variables Needed

```env
# A2E.AI
A2E_API_KEY=your-a2e-api-key
A2E_API_URL=https://api.a2e.ai

# RunPod
RUNPOD_API_KEY=your-runpod-api-key
RUNPOD_SCENE_BUILDER_ENDPOINT=your-endpoint-url
RUNPOD_IMG2VID_ENDPOINT=your-endpoint-url

# Existing
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
STRIPE_SECRET_KEY=...
```

---

## Decision Matrix

| Feature | A2E.AI | RunPod | Winner |
|---------|--------|--------|--------|
| Character Gen | ✅ Excellent | ❌ No | **A2E** |
| Uncensored | ✅ Yes | ✅ Yes | **Tie** |
| Custom Workflows | ❌ No | ✅ Yes | **RunPod** |
| Lipsync | ✅ Built-in | ❌ Complex | **A2E** |
| Cost (low volume) | ⚠️ $10/mo | ✅ Pay-per-use | **RunPod** |
| Cost (high volume) | ✅ Fixed | ⚠️ Variable | **A2E** |
| Setup Time | ✅ Fast | ⚠️ Moderate | **A2E** |
| Reliability | ✅ 99.99% SLA | ⚠️ Self-managed | **A2E** |
| Scene Building | ❌ No | ✅ Custom workflow | **RunPod** |

**Recommendation:** Use both - they complement each other perfectly!

---

## Next Steps

1. **Sign up for A2E.AI** ($9.99/month)
2. **Get API key** from A2E dashboard
3. **Sign up for RunPod** (free credits available)
4. **I'll help you deploy** the MickMumpitz workflows
5. **Update canvas** with new node types
6. **Test the hybrid workflow**

This gives you the **best of both worlds**: reliable uncensored character gen + custom action workflows!
