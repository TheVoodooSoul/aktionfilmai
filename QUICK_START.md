# Token System Quick Start Guide

Everything you need to get the token system up and running.

---

## What Was Built

✅ Complete token purchase system ($10 first, $5 additional)
✅ Stripe payment integration with webhooks
✅ Token-based submissions (1 per token)
✅ Token-based voting (3 votes per token)
✅ Discord-ready link with rich preview
✅ Success page with Discord widget
✅ Full documentation

---

## 3-Step Setup

### Step 1: Update Database

Run the SQL from `CONTEST_DB_SCHEMA.sql` (lines 98-129) in your Supabase SQL Editor to create the token tables.

### Step 2: Configure Stripe Webhook

1. Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)
2. Add endpoint: `https://yourdomain.com/api/stripe/webhook`
3. Select event: `payment_intent.succeeded`
4. Copy webhook secret (starts with `whsec_`)
5. Add to `.env.local`:
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
   ```

See `WEBHOOK_SETUP.md` for detailed instructions.

### Step 3: Share Link in Discord

Post this in your Discord server:

```
🎬 Enter the Aktion Hero Contest!
Buy your token: https://yourdomain.com/contest/buy-token

💰 $10 first | $5 additional
✅ 1 submission + 3 votes
```

See `DISCORD_LINK_SETUP.md` for more examples.

---

## Documentation Index

| Document | Purpose |
|----------|---------|
| `QUICK_START.md` | This file - Get started quickly |
| `TOKEN_SYSTEM.md` | Complete technical documentation |
| `WEBHOOK_SETUP.md` | Stripe webhook configuration |
| `DISCORD_LINK_SETUP.md` | Discord sharing & embeds |

---

**Just share the link in Discord and you're live!** 🚀
