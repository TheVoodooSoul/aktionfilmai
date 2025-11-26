# AktionFilmAI Token System Documentation

## Overview

The token system allows users to purchase submission tokens that grant them the ability to:
- Submit **1 video entry** to a contest
- Cast **3 votes** on contest submissions

This system replaces the direct payment-per-submission model with a pre-paid token model, making it easier to manage Discord integrations and user permissions.

---

## Pricing

- **First Token**: $10 USD (1000 cents)
- **Additional Tokens**: $5 USD (500 cents)

The pricing is determined automatically based on whether the user has previously purchased a token for the current contest.

---

## Database Schema

### `submission_tokens` Table

```sql
CREATE TABLE submission_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  contest_id UUID REFERENCES contests(id) ON DELETE CASCADE,
  token_code TEXT UNIQUE NOT NULL, -- Format: AKT-XXXXXXXXXX
  payment_intent_id TEXT, -- Stripe payment intent ID
  amount_paid INTEGER NOT NULL, -- in cents
  submission_allowance INTEGER DEFAULT 1,
  votes_remaining INTEGER DEFAULT 3,
  is_first_purchase BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'active', -- active, used, expired
  created_at TIMESTAMP DEFAULT NOW(),
  used_for_submission_at TIMESTAMP,
  expires_at TIMESTAMP
);
```

### `token_vote_usage` Table

Tracks which votes were cast using which tokens (for analytics and debugging):

```sql
CREATE TABLE token_vote_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id UUID REFERENCES submission_tokens(id) ON DELETE CASCADE,
  vote_id UUID REFERENCES contest_votes(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(token_id, vote_id)
);
```

---

## User Flow

### 1. Purchase Token (from Discord or Website)

**Route**: `/contest/buy-token`

**Process**:
1. User visits the token purchase page
2. System checks if this is their first token purchase for the contest
3. Stripe payment intent is created with appropriate pricing
4. User completes payment via Stripe Elements
5. On success, token is generated and user is redirected to success page

**API Endpoints**:
- `POST /api/contest/purchase-token` - Creates Stripe payment intent
- `POST /api/contest/confirm-token-payment` - Generates token after payment succeeds

### 2. Submit Entry with Token

**Route**: `/contest` (submission form)

**Process**:
1. User fills out submission form
2. Frontend fetches user's available tokens
3. User selects a token to use for submission
4. Submission is created and token's `submission_allowance` is decremented
5. If token is fully used (0 submissions, 0 votes), status changes to "used"

**API Endpoint**:
- `POST /api/contest/submit-with-token` - Creates submission using token
- `GET /api/contest/submit-with-token?userId=X&contestId=Y` - Gets available tokens

### 3. Vote with Token

**Route**: `/contest/vote`

**Process**:
1. User views contest submissions
2. User clicks vote button
3. Frontend passes tokenId with vote request
4. System validates token has votes remaining
5. Vote is recorded and token's `votes_remaining` is decremented
6. Token usage is tracked in `token_vote_usage` table

**API Endpoint**:
- `POST /api/contest/vote` - Records vote and consumes token vote allowance

---

## API Routes

### Purchase Token

**POST** `/api/contest/purchase-token`

Request body:
```json
{
  "contestId": "uuid",
  "userId": "uuid",
  "userEmail": "user@example.com"
}
```

Response:
```json
{
  "clientSecret": "pi_xxx_secret_xxx",
  "paymentIntentId": "pi_xxx",
  "amount": 1000,
  "isFirstPurchase": true
}
```

### Confirm Token Payment

**POST** `/api/contest/confirm-token-payment`

Request body:
```json
{
  "paymentIntentId": "pi_xxx"
}
```

Response:
```json
{
  "success": true,
  "token": {
    "id": "uuid",
    "token_code": "AKT-A1B2C3D4E5F6",
    "submission_allowance": 1,
    "votes_remaining": 3,
    "status": "active"
  }
}
```

### Get Token Details

**GET** `/api/contest/token?tokenId=UUID`

or

**GET** `/api/contest/token?tokenCode=AKT-XXX`

Response:
```json
{
  "token": {
    "id": "uuid",
    "user_id": "uuid",
    "contest_id": "uuid",
    "token_code": "AKT-A1B2C3D4E5F6",
    "amount_paid": 1000,
    "submission_allowance": 1,
    "votes_remaining": 3,
    "status": "active",
    "created_at": "2024-12-01T00:00:00.000Z"
  }
}
```

### Submit with Token

**POST** `/api/contest/submit-with-token`

Request body:
```json
{
  "tokenId": "uuid",
  "contestId": "uuid",
  "userId": "uuid",
  "userEmail": "user@example.com",
  "userName": "John Doe",
  "submissionName": "My Awesome Film",
  "videoUrl": "https://youtube.com/watch?v=xxx",
  "platform": "youtube",
  "description": "A cool action film",
  "duration": 120
}
```

Response:
```json
{
  "success": true,
  "submission": {
    "id": "uuid",
    "status": "approved",
    ...
  },
  "votesRemaining": 3
}
```

**GET** `/api/contest/submit-with-token?userId=UUID&contestId=UUID`

Response:
```json
{
  "tokens": [
    {
      "id": "uuid",
      "token_code": "AKT-XXX",
      "submission_allowance": 1,
      "votes_remaining": 3,
      "status": "active"
    }
  ]
}
```

### Vote with Token

**POST** `/api/contest/vote`

Request body:
```json
{
  "submissionId": "uuid",
  "userId": "uuid",
  "voteType": "community",
  "tokenId": "uuid"
}
```

Response:
```json
{
  "success": true,
  "votesRemaining": 2
}
```

### Get Active Contest

**GET** `/api/contest/active`

Response:
```json
{
  "contest": {
    "id": "uuid",
    "name": "First Aktion Hero Contest",
    "theme": "A Christmas Story",
    "description": "...",
    "submission_deadline": "2024-12-23T23:59:59.000Z",
    "first_submission_price": 1000,
    "additional_submission_price": 500,
    "status": "active"
  }
}
```

---

## Discord Integration

### Direct Link from Discord

Share this link in your Discord server to allow members to purchase tokens:

```
https://yourdomain.com/contest/buy-token
```

Users will:
1. Be prompted to log in (if not already)
2. See pricing ($10 first, $5 additional)
3. Complete payment via Stripe
4. Receive their token code
5. See the Discord widget to join the community

### Discord Bot Integration (Future Enhancement)

You could build a Discord bot that:
- Generates purchase links with user tracking
- Sends token codes via DM after purchase
- Checks token validity
- Reminds users to vote

---

## Token Code Format

Token codes follow this format: `AKT-XXXXXXXXXXXXXXXX`

- Prefix: `AKT-` (stands for AktionFilm)
- 16 hexadecimal characters (randomly generated)
- Example: `AKT-A1B2C3D4E5F6G7H8`

Token codes are:
- Unique across all tokens
- Generated using cryptographic random bytes
- Case-insensitive
- Easy to copy/paste

---

## Token Lifecycle

1. **Created** - Token is generated after successful payment
   - `status: 'active'`
   - `submission_allowance: 1`
   - `votes_remaining: 3`

2. **Partially Used** - User has submitted or voted but not used all allowances
   - `status: 'active'`
   - `submission_allowance: 0-1`
   - `votes_remaining: 0-3`

3. **Fully Used** - All allowances consumed
   - `status: 'used'`
   - `submission_allowance: 0`
   - `votes_remaining: 0`

4. **Expired** (Optional - not currently implemented)
   - `status: 'expired'`
   - Could be set if contest ends and token wasn't used

---

## Frontend Integration Examples

### Check User's Available Tokens

```typescript
const response = await fetch(
  `/api/contest/submit-with-token?userId=${userId}&contestId=${contestId}`
);
const { tokens } = await response.json();

// Filter tokens with submission allowance
const availableForSubmission = tokens.filter(
  t => t.submission_allowance > 0
);

// Filter tokens with votes remaining
const availableForVoting = tokens.filter(
  t => t.votes_remaining > 0
);
```

### Submit Entry with Token

```typescript
const response = await fetch('/api/contest/submit-with-token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tokenId: selectedToken.id,
    contestId,
    userId,
    userEmail,
    submissionName,
    videoUrl,
    // ... other fields
  }),
});

const { success, submission, votesRemaining } = await response.json();
```

### Vote with Token

```typescript
const response = await fetch('/api/contest/vote', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    submissionId,
    userId,
    voteType: 'community',
    tokenId: selectedToken.id,
  }),
});

const { success, votesRemaining } = await response.json();
```

---

## Security Considerations

1. **Token Validation**: Always validate token ownership (userId matches)
2. **Allowance Checks**: Verify token has allowances before use
3. **Duplicate Prevention**: Database constraints prevent double-voting
4. **Payment Verification**: Always verify payment status with Stripe before generating token
5. **Contest Validation**: Ensure contest is active before accepting submissions

---

## Testing

### Test Token Purchase Flow

1. Visit `/contest/buy-token`
2. Use Stripe test card: `4242 4242 4242 4242`
3. Complete payment
4. Verify token appears on success page
5. Check database for token record

### Test Submission with Token

1. Purchase a token (or use existing)
2. Go to `/contest` submission form
3. Select token from dropdown
4. Submit entry
5. Verify `submission_allowance` decremented
6. Verify `votes_remaining` still equals 3

### Test Voting with Token

1. Go to `/contest/vote`
2. Click vote on a submission
3. Select token when prompted
4. Verify vote is recorded
5. Verify `votes_remaining` decremented

---

## Future Enhancements

1. **Token Gifting**: Allow users to gift tokens to others
2. **Token Bundles**: Sell multi-token packages at discount
3. **Token Expiration**: Auto-expire unused tokens after contest ends
4. **Token Analytics**: Dashboard showing token usage stats
5. **Discord Bot**: Automated token delivery via Discord DM
6. **Token Transfer**: Allow transferring unused tokens between contests
7. **Subscription Tokens**: Monthly subscription that auto-credits tokens

---

## Support & Troubleshooting

### Common Issues

**"Token not found"**
- Verify token belongs to the user making the request
- Check token hasn't been deleted
- Ensure tokenId or tokenCode is correct

**"Token has no submission allowance remaining"**
- Token was already used for a submission
- User needs to purchase another token

**"Token has no votes remaining"**
- All 3 votes have been used
- User needs to purchase another token for more votes

**Payment succeeded but no token generated**
- Check Stripe webhook logs
- Verify payment intent metadata is correct
- Check database for token with `payment_intent_id`

---

## Database Migration

To add the token system to your existing database, run:

```bash
psql -h your-db-host -U your-user -d your-db < CONTEST_DB_SCHEMA.sql
```

Or execute the token-related SQL from `CONTEST_DB_SCHEMA.sql` in your Supabase SQL editor.

The schema includes:
- `submission_tokens` table creation
- `token_vote_usage` table creation
- Indexes for performance
- Foreign key constraints

---

## Monitoring

### Key Metrics to Track

1. **Token Sales**
   - First tokens vs additional tokens
   - Revenue per contest
   - Conversion rate from visit to purchase

2. **Token Usage**
   - Submission rate (tokens with submission_allowance = 0)
   - Vote rate (average votes_remaining per token)
   - Unused tokens (still have allowances)

3. **User Behavior**
   - Average tokens purchased per user
   - Time between purchase and usage
   - Completion rate (users who use all allowances)

### Sample Queries

**Total revenue from tokens:**
```sql
SELECT SUM(amount_paid) / 100.0 AS total_revenue
FROM submission_tokens
WHERE contest_id = 'your-contest-id';
```

**Token usage breakdown:**
```sql
SELECT
  status,
  COUNT(*) as count,
  AVG(submission_allowance) as avg_submissions_left,
  AVG(votes_remaining) as avg_votes_left
FROM submission_tokens
WHERE contest_id = 'your-contest-id'
GROUP BY status;
```

**Top users by token purchases:**
```sql
SELECT
  user_id,
  COUNT(*) as tokens_purchased,
  SUM(amount_paid) / 100.0 as total_spent
FROM submission_tokens
WHERE contest_id = 'your-contest-id'
GROUP BY user_id
ORDER BY tokens_purchased DESC
LIMIT 10;
```

---

## Contact

For questions or issues with the token system, please contact the development team or open an issue on GitHub.
