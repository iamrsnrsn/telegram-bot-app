# Telegram Mini App - Earn & Withdraw Platform

A complete, production-ready Telegram Mini App built on Cloudflare infrastructure (Pages + Workers + D1) that allows users to earn rewards through ads, tasks, and referrals, then withdraw to their wallets.

## Features

### User Features

- 💰 **Balance Management**: Track earnings and balance in real-time
- 🎁 **Daily Login Rewards**: Claim daily rewards with streak tracking
- 📺 **Watch Video Ads**: Earn by watching video ads (with hourly/daily limits)
- ✅ **Complete Tasks**: Earn by completing simple tasks (join channels, view posts)
- 👥 **Referral System**: Invite friends and earn referral bonuses
- 💸 **Instant Withdrawals**: Request withdrawals with instant balance deduction

### Admin Features

- ⚙️ **Config Management**: Adjust rewards, limits, and bonuses
- 📝 **Task Creation**: Create and manage tasks for users
- 💳 **Withdrawal Management**: Approve or reject withdrawal requests
- 📈 **User Monitoring**: View user statistics and activity

## Tech Stack

- **Frontend**: Plain HTML, CSS, JavaScript (no frameworks)
- **Backend**: Cloudflare Pages Functions
- **Database**: Cloudflare D1 (SQLite)
- **Authentication**: Telegram WebApp with HMAC verification
- **Hosting**: Cloudflare Pages

## Project Structure

```
project/
├── public/
│   ├── index.html          # Main app interface
│   ├── style.css           # Modern, clean styling
│   └── script.js           # Client-side logic
├── functions/
│   └── api/                # Cloudflare Pages Functions
│       ├── auth/           # Authentication endpoints
│       ├── user/           # User management
│       ├── config/         # App configuration
│       ├── daily/          # Daily rewards
│       ├── tasks/          # Task management
│       ├── ads/            # Ad watching
│       ├── referrals/      # Referral system
│       └── withdraw/       # Withdrawal processing
├── schema.sql              # D1 database schema
├── DEPLOYMENT.md           # Deployment instructions
└── SECURITY.md             # Security documentation
```

## Quick Start

### Prerequisites

1. Cloudflare account
2. Telegram Bot (create via @BotFather)
3. Wrangler CLI: `npm install -g wrangler`

### Setup

1. **Create D1 Database**

```bash
wrangler d1 create earn-app-db
```

2. **Initialize Database**

```bash
wrangler d1 execute earn-app-db --file=./schema.sql
```

3. **Configure Secrets**

```bash
wrangler pages secret put BOT_TOKEN
wrangler pages secret put ADMIN_IDS
```

4. **Deploy**

```bash
wrangler pages deploy public --project-name=earn-app
```

5. **Configure Telegram Bot**

- Set Web App URL in @BotFather
- Update bot username in `script.js`

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions.

## Security

### Protected Features

✅ Telegram HMAC authentication  
✅ Admin whitelist protection  
✅ Server-side balance validation  
✅ Instant withdrawal deduction (prevents double-spend)  
✅ SQL injection prevention

### Security Considerations

⚠️ Ad completion relies on client callback (can add server verification)  
⚠️ Task timer is client-side (low risk, one-time completion)

See [SECURITY.md](SECURITY.md) for complete security documentation.

## Database Schema

### Tables

- `config` - Global app configuration
- `users` - User accounts and balances
- `tasks` - Available tasks
- `ad_watches` - Ad watch tracking for limits
- `withdrawals` - Withdrawal requests and history

### Key Features

- Immutable referrer tracking
- Atomic balance updates
- Instant withdrawal deduction
- Completed tasks JSON array

## Workflow

1. **User Authentication**
   - Client sends Telegram `initData`
   - Server verifies HMAC signature
   - Returns trusted `userId`

2. **User Creation**
   - Check if user exists
   - Create with new user bonus
   - Process referral if applicable

3. **Earning**
   - Daily login rewards (streak tracking)
   - Watch ads (hourly/daily limits)
   - Complete tasks (one-time)
   - Referral bonuses (on new user creation)

4. **Withdrawal**
   - User requests withdrawal
   - Server validates amount and balance
   - **Instant deduction** from balance
   - Creates pending request
   - Admin approves/rejects (no refund on reject)

## Configuration

Default values (adjustable via admin panel):

- Ad Reward: 0.10
- Daily Login Reward: 0.50
- Referral Bonus: 1.00
- New User Bonus: 0.50
- Minimum Withdrawal: 5.00

## API Endpoints

### Authentication

- `POST /api/auth/verify` - Verify Telegram initData

### User

- `POST /api/user/get-or-create` - Get or create user

### Config

- `GET /api/config/get` - Get app config
- `POST /api/config/update` - Update config (admin)

### Daily Rewards

- `POST /api/daily/checkin` - Claim daily reward

### Tasks

- `GET /api/tasks/list` - List all tasks
- `POST /api/tasks/create` - Create task (admin)
- `POST /api/tasks/complete/:taskId` - Complete task

### Ads

- `GET /api/ads/counts` - Get watch counts
- `POST /api/ads/complete` - Complete ad watch

### Referrals

- `GET /api/referrals/list` - List user's referrals

### Withdrawals

- `POST /api/withdraw/request` - Request withdrawal
- `GET /api/withdraw/history` - Get user's history
- `GET /api/withdraw/pending` - Get pending (admin)
- `POST /api/withdraw/approve` - Approve (admin)
- `POST /api/withdraw/reject` - Reject (admin)

## Design Philosophy

- **Clean & Modern**: High contrast, generous white space
- **Mobile-First**: Optimized for Telegram mobile experience
- **Trustworthy**: Clear information hierarchy, professional aesthetic
- **Engaging**: Gamification elements (streaks, rewards)

## License

This is a template project. Use freely for your own Telegram Mini Apps.

## Support

For issues or questions:

1. Check [DEPLOYMENT.md](DEPLOYMENT.md) for setup help
2. Review [SECURITY.md](SECURITY.md) for security concerns
3. Check Cloudflare D1 documentation for database issues

## Roadmap

- [ ] Integrate AdsGram video ads (Rewarded/Interstitial formats)
- [ ] Implement rate limiting
- [ ] Add fraud detection
- [ ] Add analytics dashboard
- [ ] Multi-language support
- [ ] Enhanced admin features
