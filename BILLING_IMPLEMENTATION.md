# Billing Implementation Guide

This project uses Clerk's billing feature to manage subscriptions for CISSP Mastery.

## Plans

Based on your Clerk dashboard setup:

- **Free Plan** (`free_user`): Always free, limited access
- **Paid Plan** (`paid`): $10/month or $60/year

## Setup Steps

### 1. Enable Billing in Clerk Dashboard

1. Go to your Clerk Dashboard
2. Navigate to "Billing Settings"
3. Enable billing and connect your Stripe account
4. Create the following plans:
   - Plan key: `free_user` (Free tier)
   - Plan key: `paid` (Paid tier - $10/month, $60/year)

### 2. Pricing Page

The pricing page is available at `/pricing` and uses Clerk's `<PricingTable />` component.

```typescript
// src/app/pricing/page.tsx
import { PricingTable } from '@clerk/nextjs';

export default function PricingPage() {
  return <PricingTable />;
}
```

### 3. Protecting Content

#### Method 1: Using the `<ProtectedContent>` Component

```typescript
import ProtectedContent from '@/components/ProtectedContent';

export default function PremiumPage() {
  return (
    <ProtectedContent plan="paid">
      <h1>Premium flashcards and content</h1>
      {/* Your premium content here */}
    </ProtectedContent>
  );
}
```

#### Method 2: Using Clerk's `<Protect>` Component Directly

```typescript
import { Protect } from '@clerk/nextjs';

export default function PremiumFeature() {
  return (
    <Protect
      plan="paid"
      fallback={<p>Upgrade to access this feature</p>}
    >
      <h1>Premium Feature</h1>
    </Protect>
  );
}
```

#### Method 3: Server-Side Check with `has()` Method

```typescript
import { hasPaidAccess, getUserPlan } from '@/lib/subscription';

export default function Dashboard() {
  const isPaid = hasPaidAccess();
  const userPlan = getUserPlan();

  return (
    <div>
      <p>Your plan: {userPlan}</p>
      {isPaid ? (
        <div>Premium dashboard content</div>
      ) : (
        <div>Free tier content</div>
      )}
    </div>
  );
}
```

## Usage Examples

### Gating Flashcard Features

```typescript
// src/app/flashcards/[domain]/page.tsx
import ProtectedContent from '@/components/ProtectedContent';
import { hasPaidAccess } from '@/lib/subscription';

export default async function FlashcardsPage({ params }) {
  const isPaid = hasPaidAccess();
  const maxCards = isPaid ? 1000 : 10; // Free users get 10 cards

  return (
    <div>
      <h1>CISSP Domain {params.domain}</h1>

      {/* Show limited cards for free users */}
      <FlashcardList limit={maxCards} />

      {/* Premium content for paid users only */}
      <ProtectedContent plan="paid">
        <AdvancedAnalytics />
        <DetailedProgress />
        <CustomStudyPlans />
      </ProtectedContent>
    </div>
  );
}
```

### Conditional Rendering Based on Plan

```typescript
import { getUserPlan } from '@/lib/subscription';

export default function StudyDashboard() {
  const plan = getUserPlan();

  return (
    <div>
      {plan === 'free' && (
        <div className="bg-purple-600 text-white p-4 rounded-lg mb-4">
          <p>
            Upgrade to access all 1000+ flashcards and advanced features!
          </p>
          <Link href="/pricing">View Plans</Link>
        </div>
      )}

      {/* Rest of dashboard */}
    </div>
  );
}
```

## Important Notes

1. **Plan Keys**: Ensure the plan keys in your code (`free_user`, `paid`) match exactly with the plan keys configured in your Clerk dashboard.

2. **Server vs Client Components**:
   - Use `auth()` from `@clerk/nextjs/server` in server components
   - Use `useAuth()` hook in client components

3. **Testing**: Test both free and paid user flows thoroughly before going live.

4. **Stripe Webhook**: Clerk handles webhook events from Stripe automatically.

## Links

- Pricing page: `/pricing`
- Clerk Billing Docs: https://clerk.com/docs/nextjs/guides/billing/for-b2c
- Stripe Dashboard: https://dashboard.stripe.com
