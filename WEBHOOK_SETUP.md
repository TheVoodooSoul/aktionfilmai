# Stripe Webhook Setup for Token System

The webhook automatically generates tokens when users complete payment, making the system more reliable than relying on client-side confirmation.

## Why Use Webhooks?

✅ **More Reliable**: Tokens are generated even if user closes browser after payment
✅ **Secure**: Server-side validation ensures payment actually succeeded
✅ **No Duplicates**: Webhook checks if token already exists
✅ **Better UX**: Users get tokens immediately after payment

---

## Setup Steps

### 1. Configure Stripe Webhook in Dashboard

1. Go to [Stripe Dashboard → Developers → Webhooks](https://dashboard.stripe.com/webhooks)

2. Click **"Add endpoint"**

3. Enter your endpoint URL:
   - **Development**: `https://your-ngrok-url.ngrok.io/api/stripe/webhook`
   - **Production**: `https://yourdomain.com/api/stripe/webhook`

4. Select events to listen for:
   - ✅ `payment_intent.succeeded` (for token generation)
   - ✅ `checkout.session.completed` (for subscriptions)
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `invoice.payment_succeeded`
   - ✅ `invoice.payment_failed`

5. Click **"Add endpoint"**

6. Copy the **Signing secret** (starts with `whsec_...`)

### 2. Add Webhook Secret to Environment Variables

Add to your `.env.local`:

```bash
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 3. Test with Stripe CLI (Development)

Install Stripe CLI:
```bash
brew install stripe/stripe-cli/stripe
```

Login to Stripe:
```bash
stripe login
```

Forward webhook events to your local server:
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

This will give you a webhook signing secret like `whsec_xxxxx` - add it to `.env.local`

Trigger a test payment:
```bash
stripe trigger payment_intent.succeeded
```

---

## How It Works

### Token Purchase Flow with Webhook

1. **User submits payment** on `/contest/buy-token`
2. **Stripe processes payment** (payment intent created)
3. **Payment succeeds** → Stripe sends `payment_intent.succeeded` event to webhook
4. **Webhook receives event** at `/api/stripe/webhook`
5. **Webhook validates** payment metadata contains:
   - `type: 'submission_token'`
   - `contestId`
   - `userId`
   - `isFirstPurchase`
6. **Webhook generates token**:
   - Creates unique token code (e.g., `AKT-A1B2C3D4E5F6`)
   - Stores in `submission_tokens` table
   - Sets `submission_allowance: 1` and `votes_remaining: 3`
7. **Frontend confirms** token was created
8. **User redirected** to success page showing token code

### Webhook Event Handler

The webhook handles this event:

```typescript
case 'payment_intent.succeeded': {
  const paymentIntent = event.data.object as Stripe.PaymentIntent;

  // Check if it's a token purchase
  if (paymentIntent.metadata.type === 'submission_token') {
    // Generate unique token code
    const tokenCode = generateUniqueCode();

    // Create token in database
    await supabase.from('submission_tokens').insert({
      user_id: paymentIntent.metadata.userId,
      contest_id: paymentIntent.metadata.contestId,
      token_code: tokenCode,
      payment_intent_id: paymentIntent.id,
      amount_paid: paymentIntent.amount,
      submission_allowance: 1,
      votes_remaining: 3,
    });
  }
}
```

---

## Testing

### Test Token Purchase (Local Development)

1. Start Stripe webhook listener:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

2. Start your dev server:
   ```bash
   npm run dev
   ```

3. Go to `http://localhost:3000/contest/buy-token`

4. Use test card:
   - Card: `4242 4242 4242 4242`
   - Exp: Any future date
   - CVC: Any 3 digits

5. Complete payment

6. Check terminal - you should see:
   ```
   ✅ Token created for user abc123: AKT-XXXXXXXXXXXX (Payment: pi_xxxx)
   ```

7. Verify in Supabase - check `submission_tokens` table for new entry

### Test Webhook Manually

Trigger a test webhook event:
```bash
stripe trigger payment_intent.succeeded
```

Check your server logs for the webhook handler output.

---

## Monitoring

### Check Webhook Logs in Stripe Dashboard

1. Go to [Stripe Dashboard → Developers → Webhooks](https://dashboard.stripe.com/webhooks)
2. Click on your webhook endpoint
3. View **"Events"** tab to see all received events
4. Check for errors in the **"Attempts"** column

### Common Issues

**Webhook returns 400 "Invalid signature"**
- Wrong `STRIPE_WEBHOOK_SECRET` in `.env.local`
- Using test mode secret in production (or vice versa)
- Check you copied the full secret including `whsec_` prefix

**Webhook returns 500 error**
- Check server logs for detailed error
- Verify Supabase credentials are correct
- Ensure `submission_tokens` table exists

**Token not created after payment**
- Check webhook logs in Stripe dashboard
- Verify `payment_intent.succeeded` event is being sent
- Check payment intent has correct metadata:
  - `type: 'submission_token'`
  - `contestId`
  - `userId`

**Duplicate tokens created**
- Webhook has duplicate prevention built-in
- Checks if token with same `payment_intent_id` already exists
- If duplicates still occur, check Supabase logs

---

## Production Deployment

### 1. Update Webhook URL

In Stripe Dashboard:
- Change endpoint URL to production domain
- Example: `https://aktionfilmai.com/api/stripe/webhook`

### 2. Get Production Webhook Secret

- Copy the new signing secret from Stripe dashboard
- Add to production environment variables

### 3. Test in Production

- Make a real payment (you can refund it later)
- Check Stripe webhook logs
- Verify token appears in production database
- Test the full flow end-to-end

### 4. Monitor Webhook Health

Set up monitoring:
- Check webhook success rate in Stripe dashboard
- Set up alerts for failed webhook deliveries
- Monitor server logs for webhook errors

---

## Webhook Security

The webhook is secured by:

1. **Signature Verification**: Stripe signs each webhook with your secret
2. **HTTPS Only**: Webhooks only sent to HTTPS endpoints (in production)
3. **Idempotency**: Duplicate webhooks won't create duplicate tokens
4. **Metadata Validation**: Checks required fields before creating token

---

## Fallback Mechanism

The system has **dual confirmation**:

1. **Primary**: Webhook auto-generates token when payment succeeds
2. **Fallback**: Frontend can call `/api/contest/confirm-token-payment` if webhook fails

This ensures tokens are always created even if webhook has issues.

---

## Environment Variables Needed

```bash
# Stripe API Keys
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# Webhook Secret (from Stripe Dashboard)
STRIPE_WEBHOOK_SECRET=whsec_...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
```

---

## Debugging Checklist

If tokens aren't being created:

- [ ] Webhook endpoint added in Stripe dashboard
- [ ] `payment_intent.succeeded` event selected
- [ ] Webhook secret added to `.env.local`
- [ ] Webhook secret starts with `whsec_`
- [ ] Server is running and accessible
- [ ] Database tables created (run `CONTEST_DB_SCHEMA.sql`)
- [ ] Check Stripe webhook logs for errors
- [ ] Check server console for webhook handler logs
- [ ] Verify payment metadata includes `type: 'submission_token'`

---

## Support

If webhook setup fails:
1. Check Stripe webhook logs
2. Check your server logs
3. Test with `stripe trigger payment_intent.succeeded`
4. Verify environment variables are correct
5. Ensure database schema is up to date

For more help, see:
- [Stripe Webhook Documentation](https://stripe.com/docs/webhooks)
- [Stripe CLI Documentation](https://stripe.com/docs/stripe-cli)
- `TOKEN_SYSTEM.md` for full system documentation
