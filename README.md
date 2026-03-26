# Inside Pitch

Inside Pitch is a mobile-first IPL prediction web app designed for office competition. The experience is tuned for one thing: repeat daily participation with a fast prediction loop, visible leaderboard movement, and strong social pressure.

## What is included

- A manual Next.js app scaffold ready for local install when Node is available
- A mobile-first homepage showing the MVP loop, leaderboards, power-ups, and social feed
- Product decisions for rewards, leaderboard visibility, tie-break rules, and admin fallback
- Seed data that can later be replaced by an API or admin-managed database

## Product decisions

- Rewards: use bragging rights as the default motivator, then add small gift cards for playoff and final winners only
- Leaderboard visibility: public inside the office, because rank movement is the main retention lever
- Tie-breakers: hit rate, then underdog wins, then earliest locked prediction
- Platform: PWA-first web app, because shareability and zero install beat native polish for an internal product

## Suggested MVP roadmap

1. Build authentication, prediction locking, and leaderboard persistence first.
2. Add power-up inventory and streak logic next.
3. Layer in Slack reminders, banter feed, and team reactions after the loop is stable.
4. Keep an admin panel from day one so API issues never block match operations.

## Proposed stack

- Frontend: Next.js App Router with responsive PWA shell
- Backend: Node.js + Express or Next route handlers
- Database: PostgreSQL
- Hosting: Vercel for frontend, Render or Railway for backend and database

## Local run

This environment does not currently have `node` or `npm`, so the app could not be installed or started here.

When Node is available:

```bash
npm install
npm run dev
```

## Real IPL data

The match feed can use live IPL fixtures/results from CricAPI.

1. Sign up for a CricketData/CricAPI key.
2. Create `.env.local` in the project root.
3. Add:

```bash
CRICAPI_KEY=your_key_here
```

Without that key, the app falls back to demo match data so the UI still works.

## Google login

The `Continue with Google` button uses Auth.js with Google OAuth.

Add these values to `.env.local`:

```bash
AUTH_SECRET=your_random_secret
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
ADMIN_EMAILS=admin@company.com
```

Create a Google OAuth web app and use this callback URL:

```bash
http://localhost:3000/api/auth/callback/google
```

Signed-in users are stored in `data/users.json`. Any email listed in `ADMIN_EMAILS` can open `/admin/users` to manage roles, team assignment, and access status.

## Database

For local development, the app can still fall back to `data/users.json` if `DATABASE_URL` is not set.

For Heroku, set:

```bash
DATABASE_URL=postgres://...
```

When `DATABASE_URL` exists, the app stores users in Postgres and auto-creates an `app_users` table on first use.

## Heroku deploy

Recommended setup for this app:

1. Create a Heroku app.
2. Add Heroku Postgres.
3. Set config vars:

```bash
AUTH_SECRET=...
CRICAPI_KEY=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
ADMIN_EMAILS=admin@company.com
```

`DATABASE_URL` is usually injected automatically by Heroku Postgres.

4. Deploy the repo to Heroku.

This repo includes a `Procfile` with:

```bash
web: npm start
```

For a small office app with 30-40 users, Heroku Postgres `mini` or `essential-0` should be sufficient depending on your expected row growth and budget. Official Heroku Postgres plan details: [Heroku Postgres Essential-tier plans](https://devcenter.heroku.com/changelog-items/2807).
