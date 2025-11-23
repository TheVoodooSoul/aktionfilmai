# 🎬 AKTION FILM AI

**Choreograph the Impossible** - Create cinematic action sequences with AI-powered tools.

## Overview

Aktion Film AI is a comprehensive platform for creating, animating, and sharing action hero content. Built with Next.js, Supabase, and integrated with cutting-edge AI models via RunComfy.

## 🚀 Features

### 1. **Infinite Canvas Node System** `/canvas`
- Node-based workflow for action sequence storyboarding
- Professional drawing tools (brush, eraser, adjustable thickness)
- AI creativity gauge for fine-tuned control
- Character reference system (up to 2 refs for consistency)
- Real-time sketch preview using dzine i2i model
- Node linking for frame interpolation (Wan inpaint)
- Image-to-video generation (Wan 2.2 fun)
- Credit-based system (1 credit per preview)

### 2. **Landing Page** `/`
- Cinematic 80s action poster aesthetic
- YouTube video background (looping)
- Film grain texture overlay
- Email capture → Supabase beta_signups
- Dynamic feature rotation system
- "JOIN THE FIGHT" CTA

### 3. **Writers Room** `/writers-room`
- AI-powered script writing assistant
- Learns from your writing style
- Save and export functionality
- OpenAI integration ready

### 4. **Preset Library** `/presets`
- Community-created presets
- Search and filter functionality
- Public/private preset sharing
- Usage tracking

### 5. **First Aktion Hero Contest** `/contest`
- Monthly 1-3 minute action scene competition
- $10 first entry, $5 subsequent
- Community voting system
- Winner receives:
  - 6 months free subscription
  - 30% of prize pool
- 70% goes to development/scaling

## 🛠 Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage
- **Canvas**: Konva + React Konva
- **State Management**: Zustand
- **Styling**: Tailwind CSS 4
- **AI Integration**: RunComfy API (dzine, Wan inpaint, Wan 2.2)
- **Payments**: Stripe
- **AI Assistant**: OpenAI (Writers Room)

## 📦 Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## ⚙️ Setup

### 1. Database Setup

Run the SQL schema in your Supabase project:

```bash
# In Supabase SQL Editor, run:
supabase-schema.sql
```

This creates:
- `profiles` - User profiles and credits
- `beta_signups` - Email captures
- `character_references` - Character consistency refs
- `canvas_projects` - Saved projects
- `generated_outputs` - AI-generated content
- `scripts` - Writers Room scripts
- `presets` - User presets
- `contest_submissions` - Contest entries
- `contest_votes` - Voting system
- `credit_transactions` - Credit history

### 2. Storage Setup

Create storage bucket in Supabase:

1. Go to Storage → Create bucket: `character-refs`
2. Make it public
3. Set up RLS policies (see `SETUP.md`)

### 3. Environment Variables

Already configured in `.env.local`:

```env
# OpenAI
OPENAI_API_KEY=sk-proj-...

# RunComfy
RUNCOMFY_API_TOKEN=...
RUNCOMFY_DEPLOYMENT_ID=...

# Stripe
STRIPE_SECRET_KEY=...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://bqxxyqlbxyvfuanoiwyh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

**TODO: Add RunComfy Workflow IDs**

```env
DZINE_WORKFLOW_ID=your-dzine-i2i-workflow-id
WAN_INPAINT_WORKFLOW_ID=your-wan-inpaint-workflow-id
WAN_2_2_WORKFLOW_ID=your-wan-2.2-fun-workflow-id
```

## 🎨 Project Structure

```
aktionfilmai/
├── app/
│   ├── api/
│   │   ├── runcomfy/
│   │   │   ├── preview/route.ts      # Dzine i2i preview
│   │   │   ├── sequence/route.ts     # Wan inpaint sequences
│   │   │   └── i2v/route.ts          # Wan 2.2 i2v
│   │   └── beta-signup/route.ts      # Email capture
│   ├── canvas/page.tsx               # Main canvas workspace
│   ├── writers-room/page.tsx         # Script writing
│   ├── presets/page.tsx              # Preset library
│   ├── contest/page.tsx              # Contest system
│   ├── page.tsx                      # Landing page
│   ├── layout.tsx                    # Root layout
│   └── globals.css                   # Global styles
├── components/
│   ├── DrawingCanvas.tsx             # Konva drawing canvas
│   ├── ToolPanel.tsx                 # Drawing tools UI
│   └── CanvasNode.tsx                # Individual canvas node
├── lib/
│   ├── supabase.ts                   # Supabase client
│   ├── store.ts                      # Zustand store
│   └── types.ts                      # TypeScript types
├── supabase-schema.sql               # Database schema
├── SETUP.md                          # Setup instructions
└── .env.local                        # Environment variables
```

## 🔧 API Routes

### Preview Generation
`POST /api/runcomfy/preview`
- Converts sketch to image using dzine i2i
- Costs: 1 credit
- Input: base64 image, creativity level, character refs

### Sequence Generation
`POST /api/runcomfy/sequence`
- Interpolates frames using Wan inpaint
- Costs: 5 credits
- Input: first frame, last frame, creativity

### Image to Video
`POST /api/runcomfy/i2v`
- Generates video from image using Wan 2.2 fun
- Costs: 10 credits
- Input: image, prompt, creativity

### Beta Signup
`POST /api/beta-signup`
- Saves email to beta_signups table
- Returns success/error message

## 💳 Credit System

| Action | Cost |
|--------|------|
| Sketch Preview (dzine i2i) | 1 credit |
| Sequence Generation (Wan inpaint) | 5 credits |
| Image to Video (Wan 2.2) | 10 credits |

## 🎯 Training Opt-In

Users can opt-in to share their outputs for model training:
- Checkbox in profile settings
- Receives **10% OFF monthly membership**
- All outputs saved to `generated_outputs` table
- `allow_training` flag set to `true`
- Discount automatically applied while opted in

## 📝 Next Steps

1. ✅ Run Supabase SQL schema
2. ✅ Set up storage bucket
3. ⏳ Add RunComfy workflow IDs to `.env.local`
4. ⏳ Test canvas drawing and preview generation
5. ⏳ Test node linking and sequence generation
6. ⏳ Test contest submission flow
7. ⏳ Set up Stripe payment integration
8. ⏳ Add authentication (Supabase Auth)
9. ⏳ Deploy to Vercel

## 🚀 Deployment

The app is configured for Vercel deployment. All environment variables should be set in Vercel dashboard.

```bash
# Build for production
npm run build

# Deploy to Vercel
vercel deploy
```

## 📄 License

All rights reserved © 2024 Aktion Film AI

---

**Unleash your inner action hero.**
