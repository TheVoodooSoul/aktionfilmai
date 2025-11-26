# Discord Link Setup Guide

How to share the token purchase link in Discord with rich preview (embed).

---

## The Link

Share this URL in your Discord server:

```
https://yourdomain.com/contest/buy-token
```

Replace `yourdomain.com` with your actual domain.

---

## Discord Embed Preview

When you paste the link in Discord, it should show a rich preview with:
- **Title**: "Buy Contest Submission Token | AktionFilmAI"
- **Description**: "Purchase your submission token for the AktionFilm Contest. $10 for first token, $5 for additional..."
- **Image**: Open Graph image (optional)

### Why it might not show up

If the link doesn't show a preview:

1. **First time sharing**: Discord caches embeds. The first time a URL is shared, it might not show preview immediately.

2. **Need OG Image**: Create an Open Graph image for better preview.

3. **Discord needs to crawl**: Discord's bot needs to visit your URL to generate preview.

---

## How to Create Open Graph Image

### Option 1: Use Canva (Easy)

1. Go to [Canva](https://www.canva.com)
2. Create design with dimensions: **1200 x 630 pixels**
3. Design your image with:
   - AktionFilmAI branding
   - Text: "Contest Submission Token"
   - "$10 First Entry | $5 Additional"
   - Your logo/graphics
4. Export as PNG
5. Save as `/public/og-image-token.png` in your project

### Option 2: Use Figma (Professional)

1. Create frame: 1200 x 630 px
2. Design your preview image
3. Export as PNG
4. Save as `/public/og-image-token.png`

### Option 3: Simple Text Image

If you don't want to design, use a simple image with text:
- Background: Black or dark color
- Text: "AktionFilm Contest - Buy Token"
- "$10 First | $5 Additional"
- Save as PNG 1200x630

---

## Test the Preview

### Method 1: Discord Embed Tester

1. Go to: https://discohook.org/
2. Paste your URL in the message box
3. See how it will look in Discord

### Method 2: Test in Discord Directly

1. Create a private channel or test server
2. Paste your URL
3. Discord should fetch and show the embed

If it doesn't show:
- Wait a few minutes (Discord cache)
- Try deleting and re-pasting
- Use "Suppress Embeds" toggle off

---

## Recommended Discord Messages

### Simple Version

```
🎬 Enter the Aktion Hero Contest!
Buy your submission token: https://yourdomain.com/contest/buy-token

💰 $10 first token | $5 additional
✅ 1 submission + 3 votes per token
```

### Detailed Version

```
🎥 **AKTION HERO CONTEST - NOW OPEN** 🎥

Ready to submit your action film masterpiece?

🎟️ **Get Your Submission Token**
👉 https://yourdomain.com/contest/buy-token

**What You Get:**
✅ Submit 1 video entry to the contest
✅ Cast 3 votes on your favorite submissions
✅ Compete for cash prizes

**Pricing:**
💰 First token: $10
💰 Additional tokens: $5

**Current Contest:**
🎄 Theme: "A Christmas Story"
📅 Deadline: December 23, 2024
🎬 Duration: 1-3 minutes
🏆 Prize: 15% of total pot

**How It Works:**
1. Click the link above
2. Purchase your token
3. Submit your video
4. Vote for other entries
5. Win prizes!

Good luck, filmmakers! 🎬
```

### With Reactions

Pin this message and add reactions:
- 🎬 = I'm participating
- 🔥 = This is awesome
- ❓ = I have questions

---

## Discord Bot Integration (Optional - Future)

You can create a Discord bot to:

1. **Generate custom links** with user tracking
2. **Send tokens via DM** after purchase
3. **Check token status** with commands like `/mytoken`
4. **Remind users to vote** before contest ends

This requires:
- Discord bot development (Discord.js or similar)
- Webhook integration with your backend
- Database queries for token status

**Not required for basic functionality** - the link sharing method works great!

---

## Pinning the Message

1. Share your message with the link
2. Right-click → "Pin Message"
3. Members can easily find it at the top

---

## Discord Server Settings

### Create a Contest Channel

1. Create channel: `#contest-submissions`
2. Pin the token purchase message
3. Use this for contest discussions

### Contest Announcement

Create announcement channel:
1. `#contest-announcements`
2. Post major updates (winners, deadlines, etc.)
3. Cross-post to main server

### Permissions

Consider:
- Read-only announcements channel
- Public contest discussion channel
- Private judging channel (staff only)

---

## Tracking Links (Advanced)

If you want to track which Discord users buy tokens:

### Option 1: UTM Parameters

Share link with tracking:
```
https://yourdomain.com/contest/buy-token?utm_source=discord&utm_campaign=contest
```

Add Google Analytics or similar to track conversions.

### Option 2: Custom Discord Links

Generate unique links per Discord user:
```
https://yourdomain.com/contest/buy-token?ref=discord_user_123
```

Track in your database which referral codes convert.

### Option 3: Discord OAuth

Let users link their Discord account:
- User logs in with Discord
- You can message them directly
- Track their purchases in database

---

## Force Discord to Refresh Embed

If you update the OG image or metadata:

1. **Clear Discord cache**:
   - Discord doesn't have built-in cache clearing
   - May take 24-48 hours to update

2. **Use Discord Embed Refresher**:
   - Go to: https://r.ismy.fun/
   - Paste your URL
   - Click "Refresh"

3. **Change URL temporarily**:
   - Add `?v=2` to URL
   - Share new URL
   - Discord sees it as different URL

---

## Checklist

Before sharing in Discord:

- [ ] Website is deployed and accessible
- [ ] SSL certificate (HTTPS) is active
- [ ] `/contest/buy-token` page loads correctly
- [ ] Open Graph metadata is set (layout.tsx exists)
- [ ] OG image created and saved to `/public/og-image-token.png`
- [ ] Test the link in Discord test channel
- [ ] Embed preview shows correctly
- [ ] Payment flow works (test with test card)
- [ ] Stripe webhook is configured
- [ ] All environment variables are set

---

## Example Discord Embed Preview

When working correctly, your link should show:

```
┌─────────────────────────────────────────┐
│  [OG IMAGE - 1200x630]                  │
│  AktionFilm Contest Token               │
├─────────────────────────────────────────┤
│  Buy Contest Submission Token |         │
│  AktionFilmAI                           │
│                                         │
│  Purchase your submission token for     │
│  the AktionFilm Contest. $10 for first  │
│  token, $5 for additional. Each token   │
│  includes 1 submission and 3 votes.     │
│                                         │
│  yourdomain.com                         │
└─────────────────────────────────────────┘
```

---

## Support

If Discord embed isn't working:
1. Wait 10-15 minutes for Discord to crawl URL
2. Check if HTTPS is working
3. Verify OG image exists at `/public/og-image-token.png`
4. Test with Discord embed validator
5. Try sharing in different channel

The link will work even without rich preview - the preview just makes it look better!
