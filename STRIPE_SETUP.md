# Stripe Setup Guide for AktionFilmAI

## 🎯 Overview
This guide will help you set up Stripe payment processing for AktionFilmAI's subscription tiers.

## 📋 Prerequisites
- Stripe account (sign up at https://stripe.com)
- Access to Stripe Dashboard

## 🔧 Step 1: Create Products & Prices in Stripe Dashboard

1. Go to **Products** in Stripe Dashboard: https://dashboard.stripe.com/products
2. Click **+ Add Product** for each tier:

### Hobbyist Tier
- **Name**: AktionFilmAI - Hobbyist
- **Description**: 100 credits/month for action sequence creation
- **Price**: $9.00 USD
- **Billing**: Recurring - Monthly
- **Save the Price ID** (starts with `price_`) → Use for `STRIPE_PRICE_HOBBYIST`

### Indie Tier
- **Name**: AktionFilmAI - Indie
- **Description**: 500 credits/month for professional creators
- **Price**: $29.00 USD
- **Billing**: Recurring - Monthly
- **Save the Price ID** → Use for `STRIPE_PRICE_INDIE`

### Pro Tier
- **Name**: AktionFilmAI - Pro
- **Description**: 2000 credits/month with commercial rights
- **Price**: $99.00 USD
- **Billing**: Recurring - Monthly
- **Save the Price ID** → Use for `STRIPE_PRICE_PRO`

## 🎟️ Step 2: Create 10% Discount Coupon

1. Go to **Coupons** in Stripe Dashboard: https://dashboard.stripe.com/coupons
2. Click **+ New**
3. Set up:
   - **Name**: Data Sharing Discount
   - **ID**: `DATA_SHARING_10` (use this exact ID)
   - **Type**: Percentage
   - **Percent off**: 10%
   - **Duration**: Forever
   - **Applies to**: All products
4. Save

## 🔗 Step 3: Set Up Webhook

1. Go to **Webhooks** in Stripe Dashboard: https://dashboard.stripe.com/webhooks
2. Click **+ Add endpoint**
3. Set:
   - **Endpoint URL**: `https://aktionfilmai.com/api/stripe/webhook`
   - **Description**: AktionFilmAI Payment Events
   - **Events to send**: Select these events:
     - `checkout.session.completed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
4. Click **Add endpoint**
5. **Copy the Signing Secret** (starts with `whsec_`) → Use for `STRIPE_WEBHOOK_SECRET`

## 🔑 Step 4: Update Environment Variables

Update your `.env.local` file with the values you collected:

```bash
# Stripe Keys (already set)
STRIPE_SECRET_KEY=sk_live_... # From Stripe Dashboard → Developers → API keys
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_... # From Stripe Dashboard → Developers → API keys

# Webhook Secret (from Step 3)
STRIPE_WEBHOOK_SECRET=whsec_your_actual_webhook_secret

# Coupon ID (from Step 2)
STRIPE_DATA_SHARING_COUPON_ID=DATA_SHARING_10

# Price IDs (from Step 1)
STRIPE_PRICE_HOBBYIST=price_your_hobbyist_price_id
NEXT_PUBLIC_STRIPE_PRICE_HOBBYIST=price_your_hobbyist_price_id
STRIPE_PRICE_INDIE=price_your_indie_price_id
NEXT_PUBLIC_STRIPE_PRICE_INDIE=price_your_indie_price_id
STRIPE_PRICE_PRO=price_your_pro_price_id
NEXT_PUBLIC_STRIPE_PRICE_PRO=price_your_pro_price_id
```

## 🚀 Step 5: Deploy to Production

After updating environment variables:

1. Add environment variables to Vercel:
   ```bash
   vercel env pull
   # Or add manually in Vercel Dashboard → Settings → Environment Variables
   ```

2. Deploy:
   ```bash
   vercel --prod
   ```

## 🧪 Step 6: Test the Integration

### Test Mode (Development)
1. Use Stripe test mode keys for local development
2. Use test card: `4242 4242 4242 4242` (any future expiry, any CVC)
3. Visit: http://localhost:3000/pricing
4. Click **SUBSCRIBE NOW** on any tier
5. Complete checkout
6. Verify webhook receives events in Stripe Dashboard → Webhooks

### Production Mode
1. Switch to live mode in Stripe Dashboard
2. Update `.env.local` with live keys
3. Deploy to production
4. Test with real payment (can refund immediately)

## 📊 Database Schema

Make sure your Supabase `profiles` table has these columns:

```sql
-- Add these columns if they don't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_status TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMP;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS credits INTEGER DEFAULT 0;
```

## ✅ Verification Checklist

- [ ] All 3 products created in Stripe Dashboard
- [ ] All 3 price IDs copied and added to `.env.local`
- [ ] Data sharing coupon created with ID `DATA_SHARING_10`
- [ ] Webhook endpoint created and signing secret added
- [ ] Environment variables deployed to Vercel
- [ ] Database columns exist in `profiles` table
- [ ] Test checkout works in development
- [ ] Production checkout tested and verified

## 🎬 What Happens After Payment

1. User completes checkout on Stripe
2. Stripe sends `checkout.session.completed` webhook
3. Our webhook handler (`/api/stripe/webhook/route.ts`):
   - Creates/updates user profile
   - Sets subscription tier (hobbyist/indie/pro)
   - Adds credits (100/500/2000)
   - Applies 10% discount if data sharing enabled
4. User redirected to `/canvas` with credits ready to use
5. Credits auto-refill monthly on successful payment

## 🔒 Security Notes

- Never commit `.env.local` to git
- Use different keys for development (test mode) and production (live mode)
- Webhook secret is critical - keep it secure
- Verify webhook signatures to prevent fraud

## 📞 Support

If you encounter issues:
1. Check Stripe Dashboard → Logs for webhook delivery
2. Check Vercel logs for API errors
3. Verify all environment variables are set correctly
4. Test with Stripe test mode first before going live

## 🎉 You're Done!

Your Stripe integration is now live. Users can:
- View pricing at `/pricing`
- Subscribe to any tier
- Get 10% off with data sharing enabled
- Receive monthly credit refills automatically
