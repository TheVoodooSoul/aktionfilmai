# Token System Setup Guide

Quick guide to set up the token system for AktionFilmAI contests.

## Prerequisites

- Supabase database configured
- Stripe account with API keys
- Next.js app running

## Step 1: Update Database Schema

Run the SQL from `CONTEST_DB_SCHEMA.sql` in your Supabase SQL editor:

1. Go to Supabase Dashboard → SQL Editor
2. Copy the token-related SQL (lines 98-129 from CONTEST_DB_SCHEMA.sql)
3. Execute the SQL

This creates:
- `submission_tokens` table
- `token_vote_usage` table
- Necessary indexes

## Step 2: Verify Stripe Configuration

Ensure these environment variables are set in `.env.local`:

```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
```

## Step 3: Test the Purchase Flow

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to: `http://localhost:3000/contest/buy-token`

3. Use Stripe test card:
   - Card: `4242 4242 4242 4242`
   - Exp: Any future date
   - CVC: Any 3 digits

4. Verify token appears in success page

## Step 4: Share Discord Link

Share this link in your Discord server:

```
https://yourdomain.com/contest/buy-token
```

Or create a custom Discord button/command that links to this page.

## Step 5: Update Contest Submission Form (Optional)

If you want to integrate token selection into the existing `/contest` submission form:

1. Fetch user's available tokens
2. Display token selector before submission
3. Use `submit-with-token` API instead of old `submit` API

## Verification Checklist

- [ ] Database tables created successfully
- [ ] Can purchase token with test card
- [ ] Token code displays on success page
- [ ] Token appears in database with correct data
- [ ] Discord widget shows on success page
- [ ] Can submit entry using token
- [ ] Can vote using token
- [ ] Token allowances decrease correctly

## Key URLs

- **Purchase Token**: `/contest/buy-token`
- **Success Page**: `/contest/buy-token/success?tokenId=UUID`
- **Contest Submission**: `/contest` (existing)
- **Vote Page**: `/contest/vote` (existing)

## API Routes Created

- `POST /api/contest/purchase-token` - Initialize token purchase
- `POST /api/contest/confirm-token-payment` - Generate token after payment
- `POST /api/contest/submit-with-token` - Submit with token
- `GET /api/contest/submit-with-token` - Get user's tokens
- `POST /api/contest/vote` - Vote with token (updated)
- `GET /api/contest/token` - Get token details
- `GET /api/contest/active` - Get active contest

## Next Steps

1. **Test thoroughly** with Stripe test mode
2. **Update Discord** with purchase link
3. **Switch to live mode** when ready:
   - Update Stripe keys to live keys
   - Test with real payment (small amount)
   - Monitor for errors

## Troubleshooting

**Token not generating after payment:**
- Check browser console for errors
- Verify Stripe payment succeeded
- Check `/api/contest/confirm-token-payment` logs

**Can't submit with token:**
- Verify token has `submission_allowance > 0`
- Check token belongs to the user
- Verify contest is still active

**Votes not working:**
- Check token has `votes_remaining > 0`
- Verify user hasn't already voted on that submission
- Pass `tokenId` in the vote request

## Support

See `TOKEN_SYSTEM.md` for full documentation.
