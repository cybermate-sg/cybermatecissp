# Quick Start Guide

## 5-Minute Setup

### 1. Install Xata Client (Already Done ✅)
```bash
npm install @xata.io/client
```

### 2. Set Up Environment Variables

Add to `.env.local`:
```bash
DATABASE_URL="postgresql://[workspace]:[api-key]@[region].sql.xata.sh/[database]:[branch]"
POSTGRES_URL="postgresql://[workspace]:[api-key]@[region].sql.xata.sh/[database]:[branch]"
```

Get your connection string from [xata.io](https://xata.io) dashboard.

### 3. Run Migrations

```bash
npm run db:push
```

This creates all tables in your Xata database.

### 4. Create Admin User

**Option A: Via Database (Recommended)**

1. Sign up at `http://localhost:3000/sign-up`
2. Get your Clerk User ID from Clerk Dashboard
3. Run this SQL in Xata console:

```sql
INSERT INTO users (clerk_user_id, email, name, role, created_at, updated_at)
VALUES ('user_xxx', 'admin@example.com', 'Admin User', 'admin', NOW(), NOW())
ON CONFLICT (clerk_user_id) DO UPDATE SET role = 'admin';
```

**Option B: Update Existing User**

```sql
UPDATE users SET role = 'admin' WHERE clerk_user_id = 'user_xxx';
```

### 5. Update Seed Script

Edit `scripts/seed-cissp-content.ts` line ~253:
```typescript
const adminUserId = 'user_xxx'; // Your Clerk User ID
```

### 6. Seed Database

```bash
npm run db:seed
```

### 7. Start Development

```bash
npm run dev
```

## Test Checklist

✅ User Features:
- [ ] Navigate to `/dashboard` - See 8 domains
- [ ] Click a domain - View flashcards
- [ ] Rate flashcard - Progress saves

✅ Admin Features:
- [ ] Navigate to `/admin` - See dashboard
- [ ] Go to `/admin/flashcards` - Manage flashcards
- [ ] Go to `/admin/analytics` - View user performance

## URLs

- **User Dashboard:** `http://localhost:3000/dashboard`
- **Admin Dashboard:** `http://localhost:3000/admin`
- **Flashcards:** `http://localhost:3000/admin/flashcards`
- **Analytics:** `http://localhost:3000/admin/analytics`

## Troubleshooting

**Database Connection Error?**
- Verify `DATABASE_URL` in `.env.local`
- Check Xata dashboard for correct connection string

**Admin Access Denied?**
- Ensure user role is 'admin' in database
- Sign out and sign back in

**No Flashcards Showing?**
- Run: `npm run db:seed`
- Check `adminUserId` in seed script matches your user

## Next Steps

1. ✅ Add more flashcards via admin panel
2. ✅ Invite users to test
3. ✅ Monitor analytics
4. ✅ Deploy to production

For detailed setup, see [SETUP.md](SETUP.md)
