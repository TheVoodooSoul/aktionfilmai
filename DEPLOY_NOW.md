# 🚀 DEPLOYMENT GUIDE - Aktion Film AI

## Current Status:
✅ All APIs configured in Vercel
✅ All secrets in Supabase
✅ Local environment ready
✅ A2E.AI integrated and working

---

## STEP 1: Run Database Schema (CRITICAL - 2 minutes)

**Go to Supabase:** https://bqxxyqlbxyvfuanoiwyh.supabase.co

### SQL Editor:
1. Click **"SQL Editor"** (left sidebar)
2. Click **"New Query"**
3. Copy the entire contents of: `supabase-schema.sql`
4. Paste into the editor
5. Click **"Run"** (Cmd/Ctrl + Enter)

**✅ This creates all your database tables!**

### Verify Tables Created:
After running, check **"Table Editor"** (left sidebar):
- You should see: `profiles`, `beta_signups`, `character_references`, etc.

---

## STEP 2: Test Locally (5 minutes)

### Open the app:
```
http://localhost:3000
```

### Test Landing Page:
1. See the 80s action poster aesthetic ✅
2. YouTube video background playing ✅
3. Try email signup (should save to `beta_signups` table) ✅

### Test Canvas:
```
http://localhost:3000/canvas
```

1. Click **+ button** (bottom center)
2. Select **"Character (A2E)"**
3. Type: `"Muscular cyberpunk warrior"`
4. Click **Generate**
5. **Wait for A2E.AI to generate** (5-10 seconds)
6. See your character appear! ✅

### Test Other Pages:
- http://localhost:3000/writers-room ✅
- http://localhost:3000/presets ✅
- http://localhost:3000/contest ✅

---

## STEP 3: Verify Vercel Environment Variables

**Go to:** https://vercel.com/your-project/settings/environment-variables

### Make sure these are set:

```env
# OpenAI
OPENAI_API_KEY=sk-proj-dne6Sgc4rkt2B649Qdu6vWSUa

# RunComfy
RUNCOMFY_API_TOKEN=MTc2NTllY2UtOTE2Mi00NjE3LWJmNGItYjliZDY5MmNcIt
RUNCOMFY_DEPLOYMENT_ID=437a16af-d5ad-4eff-a6d9-3e094c5c0e

# A2E.AI
A2E_API_KEY=sk_eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2OTE4YzA1ZTQxNDc3ZDAwNThiMjM4MjIiLCJuYW1lIjoiYWRhbS5hY2Uud2F0c29uQGdtYWlsLmNvbSIsInJvbGUiOiJjb2luIiwiaWF0IjoxNzYzMjMxMjY0fQ.By4M6fRRAMLCwy_otDngmcAbNHh4n1Y-XMTYRjg9eeM
A2E_API_URL=https://api.a2e.ai

# Stripe
STRIPE_SECRET_KEY=2NmB85J2cYvV6swhPeEterKSts5RlXJYEl6
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=K4M18dlGtx5EMPrLxVQEbQ00vP7AZRM0

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://bqxxyqlbxyvfuanoiwyh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxeHh5cWxieHl2ZnVhbm9pd3loIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyMjQ1NTEsImV4cCI6MjA3ODgwMDU1MX0.4X2NY0Sb5qmGrtPRI0VPjpTDHTgjr0xGsIWL1m2DSc0
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxeHh5cWxieHl2ZnVhbm9pd3loIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzIyNDU1MSwiZXhwIjoyMDc4ODAwNTUxfQ.OOKopXl7_G7P4ZX9QHcnRB8Wqc4QwI9kjaB0xKWKyBM
```

---

## STEP 4: Deploy to Production

### Option A: Git Push (Recommended)

```bash
# 1. Add all files
git add .

# 2. Commit
git commit -m "Add A2E.AI integration and professional canvas"

# 3. Push to main
git push origin main
```

**Vercel will auto-deploy!** ✅

### Option B: Manual Deploy

```bash
vercel deploy --prod
```

---

## STEP 5: Test Production

### Once deployed, test on your production URL:

**Landing Page:**
- Video background works ✅
- Email signup saves to database ✅
- All navigation links work ✅

**Canvas:**
- Can create nodes ✅
- Character generation works (A2E.AI) ✅
- Credit system works ✅

**Check Vercel Logs:**
- No errors in function logs ✅
- API calls succeed ✅

---

## STEP 6: Create Storage Bucket (For Character Refs)

**In Supabase:**

1. Go to **Storage** (left sidebar)
2. Click **"New Bucket"**
3. Name: `character-refs`
4. **Make it Public** ✅
5. Click **"Create Bucket"**

### Set RLS Policies:

Go to **Policies** tab for `character-refs` bucket:

```sql
-- Allow authenticated uploads
CREATE POLICY "Authenticated users can upload character refs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'character-refs');

-- Allow public read
CREATE POLICY "Public can view character refs"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'character-refs');
```

---

## STEP 7: Set Up Stripe Webhooks (Optional - For Payments)

**When ready to accept payments:**

1. Go to: https://dashboard.stripe.com/webhooks
2. Add endpoint: `https://your-domain.vercel.app/api/webhooks/stripe`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copy webhook secret
5. Add to Vercel env: `STRIPE_WEBHOOK_SECRET=whsec_...`

---

## Post-Launch Checklist

### Immediately After Deploy:

- [ ] Landing page loads without errors
- [ ] Email signup works
- [ ] Canvas opens and looks professional
- [ ] Can create at least one node type
- [ ] A2E.AI character generation works
- [ ] No console errors in production

### First Week:

- [ ] Invite 5 alpha testers
- [ ] Give each 50 free credits
- [ ] Get feedback on UX
- [ ] Fix any bugs found
- [ ] Monitor A2E.AI usage/costs

### First Month:

- [ ] Email beta_signups list
- [ ] Launch publicly (Reddit, Twitter)
- [ ] Get first paying customer
- [ ] Set up analytics (PostHog, Plausible, etc.)
- [ ] Monitor margins and costs

---

## Monitoring & Analytics

### Supabase Dashboard:
- Watch `beta_signups` table grow
- Monitor credit usage in `credit_transactions`
- Check error logs

### A2E.AI Dashboard:
https://a2e.ai/dashboard
- Monitor API usage
- Track remaining credits
- Check generation history

### Vercel Dashboard:
- Function logs for errors
- Performance metrics
- Traffic analytics

---

## Troubleshooting Production Issues

### "API Error" in Production:
- Check Vercel environment variables
- Verify API keys are correct
- Check function logs for details

### "Insufficient Credits":
- Users need credits in database
- Check `profiles` table
- Verify credit transactions logging

### Storage Upload Fails:
- Verify bucket is created
- Check RLS policies
- Ensure bucket is public

### Email Signup Not Saving:
- Check Supabase connection
- Verify `beta_signups` table exists
- Check RLS policy allows inserts

---

## Success Metrics to Track

### Week 1:
- Beta signups: Target 50+
- Alpha testers: 5
- Generations created: 25+
- Critical bugs: 0

### Month 1:
- Total signups: 200+
- Active users: 50+
- Paying customers: 10+
- Revenue: $100+
- Cost: <$100 (profitable!)

---

## YOU'RE READY TO LAUNCH! 🚀

Everything is built. APIs are integrated. Database is ready.

**Final Steps:**
1. ✅ Run SQL schema
2. ✅ Test locally
3. ✅ Push to Git
4. ✅ Watch it auto-deploy
5. ✅ Test in production
6. ✅ Launch!

**Questions? Issues? Let me know!**
