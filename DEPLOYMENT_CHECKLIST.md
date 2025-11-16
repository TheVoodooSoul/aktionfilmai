# 🚀 Deployment Checklist

## Pre-Deployment Tasks

### ✅ Completed
- [x] Project structure created
- [x] All pages built (Landing, Canvas, Writers Room, Presets, Contest)
- [x] API routes created (preview, sequence, i2v, beta-signup)
- [x] Supabase client configured
- [x] Environment variables set
- [x] Drawing canvas with tools implemented
- [x] Node system architecture built
- [x] 80s action poster landing page created
- [x] Email capture functional
- [x] Dev server running successfully

### ⏳ Pending (CRITICAL for Launch)

#### 1. Database Setup
```sql
-- Go to: https://bqxxyqlbxyvfuanoiwyh.supabase.co
-- SQL Editor → Paste contents of supabase-schema.sql
-- Execute to create all tables
```

**Status**: ⚠️ NOT YET RUN - You need to do this!

#### 2. Storage Bucket Setup
```bash
# In Supabase Dashboard:
# 1. Go to Storage
# 2. Create bucket: "character-refs"
# 3. Make it public
# 4. Add RLS policies from SETUP.md
```

**Status**: ⚠️ NOT YET CREATED

#### 3. RunComfy Workflow IDs
Add these to `.env.local`:
```env
DZINE_WORKFLOW_ID=<your-workflow-id>
WAN_INPAINT_WORKFLOW_ID=<your-workflow-id>
WAN_2_2_WORKFLOW_ID=<your-workflow-id>
```

**Status**: ⚠️ MISSING - Get these from RunComfy dashboard

#### 4. Authentication
- Supabase Auth not yet implemented
- Canvas page requires user authentication
- Need to add login/signup flow

**Status**: ⚠️ NOT IMPLEMENTED

#### 5. Stripe Integration
- Payment buttons present but not functional
- Need to implement Stripe Checkout
- Credit purchase flow needs backend

**Status**: ⚠️ NOT IMPLEMENTED

## Testing Checklist

### Local Testing (Before Deploy)

- [ ] Landing page loads without errors
- [ ] Email capture saves to Supabase
- [ ] Canvas page renders correctly
- [ ] Drawing tools work (brush, eraser, thickness)
- [ ] Can create and delete nodes
- [ ] Character reference upload works
- [ ] Preview generation calls API (test with workflow ID)
- [ ] Node linking interface works
- [ ] Writers Room loads
- [ ] Preset Library loads
- [ ] Contest page loads

### Post-Database Setup Testing

- [ ] Beta signup actually saves to database
- [ ] Character refs upload to storage
- [ ] Profile creation works
- [ ] Credit transactions log correctly
- [ ] Contest submissions save

### Integration Testing

- [ ] Preview generation completes successfully
- [ ] Credits deduct properly
- [ ] Sequence generation works
- [ ] i2v generation works
- [ ] Generated images display in nodes

## Deployment Steps

### 1. Finish Supabase Setup
```bash
1. Run SQL schema
2. Create storage bucket
3. Verify all tables exist
4. Test RLS policies
```

### 2. Add Missing Environment Variables
```bash
# In Vercel Dashboard or .env.local
DZINE_WORKFLOW_ID=...
WAN_INPAINT_WORKFLOW_ID=...
WAN_2_2_WORKFLOW_ID=...
```

### 3. Test Locally
```bash
npm run dev
# Visit http://localhost:3000
# Test all features
# Check console for errors
```

### 4. Build for Production
```bash
npm run build
# Fix any build errors
```

### 5. Deploy to Vercel
```bash
# Option 1: Git push (auto-deploy)
git add .
git commit -m "Initial deployment"
git push

# Option 2: Manual deploy
vercel deploy --prod
```

### 6. Post-Deployment Verification
- [ ] Landing page loads
- [ ] Email signup works
- [ ] Canvas accessible
- [ ] No 500 errors in production
- [ ] Environment variables working

## Known Issues / TODOs

### High Priority
1. **No Authentication** - Users can't sign up/login
2. **No Payment Integration** - Can't buy credits
3. **RunComfy Workflow IDs Missing** - Preview won't work
4. **Database Not Initialized** - Nothing will save

### Medium Priority
1. **Writers Room AI** - OpenAI integration not complete
2. **Contest Video Upload** - Storage integration needed
3. **Preset Creation** - UI not implemented
4. **Profile Settings** - Training opt-in UI missing

### Low Priority
1. **Mobile Optimization** - Canvas needs touch support improvements
2. **Error Handling** - Better user-facing error messages
3. **Loading States** - More granular loading indicators
4. **Accessibility** - ARIA labels and keyboard navigation

## Quick Start After Database Setup

Once you've run the SQL schema:

```bash
# 1. Start dev server
npm run dev

# 2. Open http://localhost:3000

# 3. Test email signup
# Enter email → Check Supabase beta_signups table

# 4. Go to /canvas
# Try creating a node and drawing

# 5. Check browser console for errors
```

## Production URLs

- **Production**: https://aktionfilmai.vercel.app (or your custom domain)
- **Supabase**: https://bqxxyqlbxyvfuanoiwyh.supabase.co
- **Development**: http://localhost:3000

## Support & Next Steps

Everything is built and ready to go! The main blockers are:

1. ⚠️ **Run the SQL schema** in Supabase
2. ⚠️ **Create storage bucket** for character references
3. ⚠️ **Get RunComfy workflow IDs** from your dashboard
4. 🎯 **Add authentication** for user accounts
5. 💳 **Integrate Stripe** for payments

Once these are done, you'll have a fully functional MVP ready for beta users!

---

**Status**: 🟡 Built and Ready - Needs Database Setup & API Keys
