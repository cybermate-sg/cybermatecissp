# CISSP Mastery - Setup Guide

This guide will help you set up the CISSP Mastery application with Xata PostgreSQL database and Drizzle ORM.

## Overview

The application has been upgraded with the following features:

1. **Dynamic Flashcard System** - Flashcards are now stored in and fetched from a PostgreSQL database
2. **Admin Module** - Complete admin interface to manage domains, topics, decks, and flashcards
3. **User Progress Tracking** - Real-time tracking of user performance across all CISSP domains
4. **Admin Analytics** - Dashboard for viewing individual user performance and overall statistics
5. **Database Integration** - Xata PostgreSQL with Drizzle ORM for type-safe database operations

## Prerequisites

- Node.js 18+ installed
- A Xata account ([xata.io](https://xata.io))
- Clerk account for authentication
- Stripe account for payments (already configured)

## Step 1: Set Up Xata Database

### 1.1 Create Xata Account & Database

1. Go to [xata.io](https://xata.io) and sign up
2. Create a new database named `cisspmastery`
3. Select the region closest to your users
4. Copy your database URL (format: `postgresql://[workspace]:[api-key]@[region].sql.xata.sh/[database]:[branch]`)

### 1.2 Update Environment Variables

Add the following to your `.env.local` file:

```bash
# Xata Database
DATABASE_URL="your-xata-connection-string"
POSTGRES_URL="your-xata-connection-string"

# Existing variables (keep these)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
CLERK_SECRET_KEY=...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=...
STRIPE_SECRET_KEY=...
# ... other existing env vars
```

## Step 2: Install Dependencies

The Xata client has already been added. If starting fresh, run:

```bash
npm install
```

## Step 3: Generate and Run Database Migrations

### 3.1 Generate Migration Files

```bash
npm run db:generate
```

This creates migration files in `drizzle/migrations/` based on your schema.

### 3.2 Push Schema to Database

```bash
npm run db:push
```

This applies the schema to your Xata database, creating all tables.

## Step 4: Seed the Database

### 4.1 Create an Admin User

First, you need to create your admin user:

1. Start the development server: `npm run dev`
2. Sign up for a new account at `http://localhost:3000/sign-up`
3. Note your Clerk User ID (you can find it in the Clerk Dashboard)

### 4.2 Update Seed Script

Edit `scripts/seed-cissp-content.ts` and replace the admin user ID:

```typescript
// Line ~253
const adminUserId = 'your_clerk_user_id_here'; // Replace with actual admin Clerk user ID
```

### 4.3 Set Admin Role in Database

Manually update your user's role to 'admin' in the database:

```sql
-- Use Xata SQL Console or connect via psql
UPDATE users
SET role = 'admin'
WHERE clerk_user_id = 'your_clerk_user_id_here';
```

Or insert the user if they don't exist:

```sql
INSERT INTO users (clerk_user_id, email, name, role, created_at, updated_at)
VALUES ('your_clerk_user_id', 'admin@example.com', 'Admin User', 'admin', NOW(), NOW())
ON CONFLICT (clerk_user_id) DO UPDATE SET role = 'admin';
```

### 4.4 Run the Seed Script

```bash
npm run db:seed
```

This will populate:
- 8 CISSP Domains
- Topics for each domain
- Decks within topics
- Sample flashcards (expandable)

## Step 5: Verify Setup

### 5.1 Start Development Server

```bash
npm run dev
```

### 5.2 Test User Features

1. Navigate to `http://localhost:3000/dashboard`
2. You should see 8 CISSP domains with card counts
3. Click on a domain to view flashcards
4. Rate flashcards (1-5 confidence level)
5. Progress should be tracked in real-time

### 5.3 Test Admin Features

1. Navigate to `http://localhost:3000/admin`
2. You should see:
   - Overview dashboard with statistics
   - Flashcards management page
   - User analytics page

## Database Schema Overview

### Core Tables

#### Users & Authentication
- `users` - User accounts synced from Clerk
- `subscriptions` - Stripe subscription tracking
- `payments` - Payment history

#### Content Structure (Admin-managed)
- `domains` - 8 CISSP domains
- `topics` - Topics within each domain
- `decks` - Study decks within topics
- `flashcards` - Individual questions/answers

#### Progress Tracking (User data)
- `user_card_progress` - Per-card confidence levels and mastery status
- `deck_progress` - Aggregate statistics per deck
- `user_stats` - Overall user statistics
- `study_sessions` - Study session records
- `session_cards` - Individual card reviews within sessions

## API Endpoints

### Public API (Authentication Required)

#### Domains
- `GET /api/domains` - Fetch all domains with card counts

#### Flashcards
- `GET /api/domains/[domainId]/flashcards` - Fetch flashcards for a domain

#### Progress
- `POST /api/progress/card` - Save/update card progress
- `GET /api/progress/card?flashcardId=xxx` - Get card progress
- `GET /api/progress/domain/[domainId]` - Get domain progress stats

### Admin API (Admin Role Required)

#### Flashcards
- `GET /api/admin/flashcards` - List all flashcards
- `POST /api/admin/flashcards` - Create new flashcard
- `PATCH /api/admin/flashcards/[id]` - Update flashcard
- `DELETE /api/admin/flashcards/[id]` - Delete flashcard

#### Analytics
- `GET /api/admin/analytics/users` - Get all users with stats
- `GET /api/admin/analytics/users?userId=xxx` - Get specific user details
- `GET /api/admin/analytics/users?userId=xxx&domainId=yyy` - Get user performance per domain

## Admin Features

### 1. Flashcard Management (`/admin/flashcards`)

- Create new flashcards with:
  - Question (required)
  - Answer (required)
  - Explanation (optional)
  - Difficulty level (1-5)
  - Deck assignment
  - Published status

- Edit existing flashcards
- Delete flashcards
- Filter by deck

### 2. User Analytics (`/admin/analytics`)

View for each user:
- Total cards studied
- Study streak (days)
- Total study time
- Mastery breakdown (new, learning, mastered)
- Domain-wise progress with percentage
- Card-level confidence ratings

### 3. Bulk Upload (Future Enhancement)

Consider adding CSV/JSON upload functionality for bulk flashcard import.

## Development Workflow

### Adding New Flashcards

1. Log in as admin
2. Navigate to `/admin/flashcards`
3. Click "New Flashcard"
4. Fill in details (make sure to get the deck ID from database)
5. Alternatively, use the API:

```bash
curl -X POST http://localhost:3000/api/admin/flashcards \
  -H "Content-Type: application/json" \
  -d '{
    "deckId": "uuid-here",
    "question": "What is...",
    "answer": "...",
    "difficulty": 3
  }'
```

### Viewing User Progress

1. Navigate to `/admin/analytics`
2. Search for user by email
3. Click on user to see detailed performance
4. View domain breakdown and mastery levels

## Database Utilities

### View Data with Drizzle Studio

```bash
npm run db:studio
```

Opens a web interface at `https://local.drizzle.studio` to view/edit data.

### Generate New Migrations

After modifying `src/lib/db/schema.ts`:

```bash
npm run db:generate
npm run db:push
```

## Deployment Considerations

### Environment Variables

Ensure all production environment variables are set:

```bash
# Database
DATABASE_URL=your-production-xata-url

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
CLERK_SECRET_KEY=...
CLERK_WEBHOOK_SECRET=...

# Stripe
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...

# App
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### Database Migrations

On Vercel/production:
1. Migrations are automatically applied if using `db:push`
2. For production, consider using `drizzle-kit migrate` for safer deployments

### Webhook Setup

Ensure Clerk webhook is configured to sync users to database:
- Endpoint: `https://yourdomain.com/api/webhooks/clerk`
- Events: `user.created`, `user.updated`

## Troubleshooting

### "Cannot find module 'postgres'"

Run: `npm install postgres`

### Database Connection Error

- Verify `DATABASE_URL` is correct
- Check Xata dashboard for connection string
- Ensure database is in the same region for best performance

### Admin Access Denied

- Verify user role is set to 'admin' in database
- Check that user exists in `users` table
- Ensure Clerk user ID matches

### Flashcards Not Showing

- Run seed script: `npm run db:seed`
- Check if flashcards are marked as `is_published = true`
- Verify deck has `card_count > 0`

## Next Steps

1. **Add More Flashcards**: Expand the seed script or use admin interface
2. **Customize Domains**: Modify domain descriptions and icons
3. **Enhanced Analytics**: Add charts for user progress trends
4. **Spaced Repetition**: Implement adaptive review scheduling
5. **Mobile App**: Consider React Native version
6. **Bulk Import**: Add CSV/JSON upload for flashcards

## Support

For issues or questions:
- Check Xata documentation: https://xata.io/docs
- Drizzle ORM docs: https://orm.drizzle.team
- Create an issue in the repository

---

**Congratulations!** Your CISSP Mastery platform is now ready with dynamic flashcards, admin tools, and analytics.
