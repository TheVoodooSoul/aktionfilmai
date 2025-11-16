# 🚀 QUICK START GUIDE - You're Ready to Test!

## ✅ What's Set Up:

### 1. A2E.AI Integration
- ✅ API Key configured
- ✅ Account: AKTIONFILMAI
- ✅ Ready to generate:
  - Uncensored characters
  - Image-to-video (Wan 2.5)
  - Lipsync with dialogue

### 2. Canvas System
- ✅ Professional Freepik-style UI
- ✅ 7 node types ready
- ✅ Environment selector
- ✅ 2 character references
- ✅ Credit system

### 3. Node Types Available:
1. 👤 **Character (A2E)** - 2 credits
2. 🎭 **Scene Builder (RunPod)** - 3 credits (needs RunPod setup)
3. ✏️ **Sketch to Image** - 1 credit
4. 🖼️ **Image to Image** - 5 credits
5. ✨ **Text to Image** - 5 credits
6. 🎬 **Image to Video (A2E)** - 8 credits
7. 🗣️ **Lipsync (A2E)** - 3 credits

---

## 🎯 TEST IT NOW (5 Minutes)

### Step 1: Set Up Database (CRITICAL - Do First!)

Go to: https://bqxxyqlbxyvfuanoiwyh.supabase.co

1. Click **SQL Editor**
2. Click **New Query**
3. Open the file: `supabase-schema.sql`
4. Copy ALL the SQL
5. Paste into Supabase
6. Click **Run** (or Ctrl/Cmd + Enter)

**This creates all your database tables!**

### Step 2: Create Test User

In Supabase SQL Editor, run this:

```sql
-- Create a test user profile with credits
INSERT INTO profiles (id, email, credits, subscription_tier, subscription_status)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'test@aktionfilm.ai',
  1000,
  'pro',
  'active'
);
```

### Step 3: Open the Canvas

```
http://localhost:3000/canvas
```

### Step 4: Test Character Generation

1. Click the **red + button** (bottom center)
2. Select **"Character (A2E)"**
3. Type prompt: `"Muscular action hero with tactical gear, intense expression"`
4. Click **Generate**
5. Wait 5-10 seconds
6. See your uncensored character!

### Step 5: Test Image-to-Video

1. Once you have a character, click **+ button** again
2. Select **"Image to Video (A2E)"**
3. Upload or paste the character image
4. Type movement prompt: `"Jumping and punching forward"`
5. Click **Generate**
6. Wait 10-15 seconds
7. See your 4-second action video!

---

## 🐛 Troubleshooting

### "Insufficient credits"
- You need to create a test user (Step 2 above)
- Or update the store to have credits

### "Failed to generate"
- Check browser console for errors
- Make sure dev server is running
- Verify A2E API key is in .env.local

### "Cannot read properties of undefined"
- Run the Supabase SQL schema first
- Database tables must exist

---

## 📊 Monitor Your Usage

### A2E.AI Dashboard:
https://a2e.ai/dashboard

Check:
- Credits remaining
- Generation history
- API usage

### Supabase Dashboard:
https://bqxxyqlbxyvfuanoiwyh.supabase.co

Check:
- Database tables
- User credits
- Transaction history

---

## 🎬 Example Workflows

### Workflow 1: Simple Character Test
```
1. Character node → Generate → Get character image
2. Done! (2 credits used)
```

### Workflow 2: Character + Action Video
```
1. Character node → Generate muscular hero
2. i2v node → Add movement "throwing punch"
3. Done! (2 + 8 = 10 credits used)
```

### Workflow 3: Character + Dialogue
```
1. Character node → Generate hero
2. Lipsync node → Add dialogue "I'll be back"
3. Done! (2 + 3 = 5 credits used)
```

### Workflow 4: Full Scene (When RunPod is set up)
```
1. Upload 2 characters (Character 1 & 2 in sidebar)
2. Scene Builder node → Select "Fight Scene"
3. i2v node → Make it move
4. Done! (3 + 8 = 11 credits used)
```

---

## 💰 Pricing Reminder

### What YOU Pay (A2E with 50% discount):
- Character: ~$0.05
- i2v (4 sec): ~$0.02
- Lipsync: ~$0.10

### What USERS Pay (Your Credits):
- Character: 2 credits = $0.20
- i2v: 8 credits = $0.80
- Lipsync: 3 credits = $0.30

### Your Profit Per Generation:
- Character: $0.15 (75% margin)
- i2v: $0.78 (97.5% margin!)
- Lipsync: $0.20 (66% margin)

---

## 🚀 Next Steps After Testing

### Once Everything Works:

1. **Invite 5 Friends** (Alpha Test)
   - Give them each 50 credits
   - Get honest feedback
   - Fix any bugs

2. **Open Beta** (25 Users)
   - Email your beta_signups list
   - Give each 20 credits
   - Monitor usage

3. **Add RunPod** (Optional)
   - Set up MickMumpitz workflows
   - Even better margins
   - More customization

4. **Launch Publicly**
   - Marketing (Reddit, Twitter, etc.)
   - Start charging
   - Scale up!

---

## 📈 Success Metrics

### Week 1:
- [ ] 5 alpha testers successfully generate content
- [ ] Zero critical bugs
- [ ] All 3 A2E workflows tested

### Week 2:
- [ ] 25 beta users onboarded
- [ ] 5+ conversions to paid
- [ ] $50+ revenue

### Month 1:
- [ ] 100+ beta signups
- [ ] 20+ paying users
- [ ] Break even on initial investment

---

## 🔥 YOU'RE READY!

Everything is set up. A2E.AI is integrated. The canvas is professional.

**Just run that SQL schema and start testing!**

Questions? Issues? Let me know and I'll help debug!

🎬 **CHOREOGRAPH THE IMPOSSIBLE** 🎬
