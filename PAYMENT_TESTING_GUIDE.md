# Payment Testing Guide

This guide explains how to test the end-to-end payment journey for CISSP Mastery using Playwright E2E tests.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Test Setup](#test-setup)
- [Running Tests](#running-tests)
- [Test Coverage](#test-coverage)
- [Stripe Test Cards](#stripe-test-cards)
- [Webhook Testing](#webhook-testing)
- [Troubleshooting](#troubleshooting)
- [CI/CD Integration](#cicd-integration)

## Prerequisites

### Required Environment Variables

Ensure these environment variables are set in your `.env.local` file:

```env
# Stripe Configuration (Test Mode)
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe Price IDs
NEXT_PUBLIC_STRIPE_LIFETIME_PRICE_ID=price_...
STRIPE_PRO_MONTHLY_PRICE_ID=price_...
STRIPE_PRO_YEARLY_PRICE_ID=price_...

# Clerk Configuration
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Database
POSTGRES_URL=postgresql://...
```

### Software Requirements

- Node.js 18+
- pnpm
- Playwright (already installed via `package.json`)
- Running development server (`pnpm dev`)
- PostgreSQL database (running and migrated)

## Test Setup

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Install Playwright Browsers

```bash
pnpm playwright install
```

### 3. Set Up Authentication

The tests require authentication for signed-in user flows. Run the auth setup:

```bash
pnpm test:e2e:headed
```

This will:
1. Open a browser window
2. Prompt you to sign in with LinkedIn
3. Save your authentication state to `playwright/.auth/user.json`
4. Future tests will reuse this authentication

### 4. Start Development Server

Ensure your dev server is running:

```bash
pnpm dev
```

The server should be accessible at `http://localhost:3000`.

## Running Tests

### Run All Payment Tests

```bash
pnpm test:e2e payment
```

This runs all payment-related test files.

### Run Specific Test Suites

#### Guest User Payment Flow
```bash
pnpm playwright test payment-guest-flow
```

#### Authenticated User Payment Flow
```bash
pnpm playwright test payment-authenticated-flow
```

#### Payment Failure Scenarios
```bash
pnpm playwright test payment-failure-scenarios
```

#### Webhook Event Handling
```bash
pnpm playwright test payment-webhook-handling
```

### Run Tests in UI Mode (Recommended for Development)

```bash
pnpm test:e2e:ui
```

This opens Playwright's UI mode where you can:
- See tests running in real-time
- Inspect each step
- Time-travel through test execution
- Debug failures easily

### Run Tests in Headed Mode (See Browser)

```bash
pnpm test:e2e:headed
```

### Run Tests with Debug Mode

```bash
pnpm test:e2e:debug
```

### View Test Report

After running tests, view the HTML report:

```bash
pnpm test:e2e:report
```

## Test Coverage

### Guest User Payment Flow (`payment-guest-flow.spec.ts`)

| Test | Description |
|------|-------------|
| Complete successful payment | Full flow from homepage → email → Stripe → success |
| Email validation | Verifies invalid email is rejected |
| Email dialog cancellation | Tests user can cancel before payment |
| Pricing information display | Verifies $197 pricing is shown |
| Checkout cancellation | Tests user can navigate back from Stripe |
| Missing price ID error | Verifies API validates required parameters |
| Missing email error | Verifies guest checkout requires email |
| Keyboard navigation | Tests accessibility via keyboard |

### Authenticated User Payment Flow (`payment-authenticated-flow.spec.ts`)

| Test | Description |
|------|-------------|
| Complete payment from homepage | Signed-in user flow (no email dialog) |
| Payment from pricing page | Via Clerk's PricingTable component |
| Paid features after payment | Verifies dashboard shows paid access |
| Metadata tracking | Verifies Stripe session includes user data |
| Loading state | Checks UI shows loading during checkout |
| Success page confirmation | Verifies email confirmation message |
| Navigation options | Tests dashboard and home links |
| URL validation security | Tests open redirect prevention |
| Authentication requirement | Verifies API security |

### Payment Failure Scenarios (`payment-failure-scenarios.spec.ts`)

| Test | Description |
|------|-------------|
| Generic card decline | Tests card number `4000000000000002` |
| Insufficient funds | Tests card number `4000000000009995` |
| Expired card | Tests card number `4000000000000069` |
| Incorrect CVC | Tests card number `4000000000000127` |
| Processing error | Tests card number `4000000000000119` |
| Retry after decline | Tests user can retry with different card |
| Session data maintenance | Verifies data persists after failure |
| User-friendly errors | Checks error messages are clear |
| No success on failure | Verifies no access granted on failure |
| Database integrity | Verifies failed payments don't create subscriptions |
| Failed payment logging | Verifies failures are logged |
| API timeout handling | Tests network error scenarios |
| Stripe load failure | Tests Stripe service errors |

### Webhook Event Handling (`payment-webhook-handling.spec.ts`)

| Test | Description |
|------|-------------|
| checkout.session.completed | Tests successful payment webhook |
| payment_intent.succeeded | Tests successful payment intent |
| payment_intent.payment_failed | Tests failed payment webhook |
| Subscription lifecycle | Tests create/update/delete events |
| Invalid signature rejection | Security: rejects unsigned webhooks |
| Missing signature rejection | Security: requires signature |
| Malformed payload handling | Tests error handling |
| Duplicate event idempotency | Tests duplicate webhooks handled correctly |
| Unknown event types | Tests graceful handling |
| Database error handling | Tests resilience to DB failures |

## Stripe Test Cards

### Successful Payment Cards

| Card Number | Scenario |
|-------------|----------|
| `4242424242424242` | Always succeeds (default) |
| `4000002500003155` | Requires 3D Secure authentication |

### Declined Payment Cards

| Card Number | Decline Reason |
|-------------|----------------|
| `4000000000000002` | Generic decline |
| `4000000000009995` | Insufficient funds |
| `4000000000009987` | Lost card |
| `4000000000009979` | Stolen card |
| `4000000000000069` | Expired card |
| `4000000000000127` | Incorrect CVC |
| `4000000000000119` | Processing error |

### Card Details for All Tests

- **Expiry**: Any future date (e.g., `12/34`)
- **CVC**: Any 3 digits (e.g., `123`)
- **ZIP**: Any 5 digits (e.g., `12345`)

**Note**: These are Stripe's official test card numbers. See [Stripe Testing Documentation](https://stripe.com/docs/testing#cards) for more.

## Webhook Testing

### Testing Webhooks with Stripe CLI

For the most accurate webhook testing, use Stripe CLI:

#### 1. Install Stripe CLI

**macOS:**
```bash
brew install stripe/stripe-cli/stripe
```

**Windows:**
```bash
scoop install stripe
```

**Linux:**
```bash
# Download from https://github.com/stripe/stripe-cli/releases
```

#### 2. Login to Stripe

```bash
stripe login
```

#### 3. Forward Webhooks to Local Server

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

This will:
- Display your webhook signing secret (add to `.env.local` as `STRIPE_WEBHOOK_SECRET`)
- Forward all Stripe events to your local endpoint

#### 4. Trigger Test Events

In a new terminal, trigger specific events:

```bash
# Successful payment
stripe trigger payment_intent.succeeded

# Failed payment
stripe trigger payment_intent.payment_failed

# Checkout completed
stripe trigger checkout.session.completed

# Subscription created
stripe trigger customer.subscription.created
```

#### 5. Run Webhook Tests

```bash
pnpm playwright test payment-webhook-handling
```

### Manual Webhook Testing

You can also test webhooks by:

1. Making a real test payment through the UI
2. Monitoring the Stripe CLI output
3. Checking your database for created records
4. Verifying user access on the dashboard

## Troubleshooting

### Tests Failing to Find Stripe Checkout Elements

**Issue**: Tests can't locate Stripe checkout form fields.

**Solution**:
- Ensure Stripe checkout is loading properly
- Check for network issues blocking Stripe
- Verify `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is set correctly
- Try increasing timeout in `payment-helpers.ts`

### Authentication State Not Persisting

**Issue**: Tests fail because user is not authenticated.

**Solution**:
```bash
# Delete old auth state
rm -rf playwright/.auth

# Re-run auth setup
pnpm test:e2e:headed
```

### Webhook Tests Failing with Signature Errors

**Issue**: Webhook events rejected with "Invalid signature".

**Solution**:
- Ensure `STRIPE_WEBHOOK_SECRET` matches your Stripe CLI output
- Use `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
- Copy the webhook signing secret to `.env.local`
- Restart your dev server

### Tests Timeout on Stripe Redirect

**Issue**: Tests timeout waiting for Stripe checkout.

**Solution**:
- Check that your Stripe price IDs are valid test mode prices
- Verify your Stripe API keys are for test mode (start with `sk_test_`)
- Check network connectivity
- Increase timeout in test configuration

### Database Connection Errors

**Issue**: Tests fail with database errors.

**Solution**:
```bash
# Ensure database is running
# Run migrations
pnpm db:migrate

# Check connection string
echo $POSTGRES_URL
```

### Clerk Authentication Issues

**Issue**: Can't authenticate during test setup.

**Solution**:
- Ensure Clerk test credentials are set
- Check that LinkedIn OAuth is configured in Clerk dashboard
- Try using email/password auth instead (if configured)
- Clear browser data and retry

## CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Payment Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: cisspmastery_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install pnpm
        run: npm install -g pnpm

      - name: Install dependencies
        run: pnpm install

      - name: Install Playwright Browsers
        run: pnpm playwright install --with-deps

      - name: Run database migrations
        run: pnpm db:migrate
        env:
          POSTGRES_URL: postgresql://postgres:postgres@localhost:5432/cisspmastery_test

      - name: Start dev server
        run: pnpm dev &
        env:
          STRIPE_SECRET_KEY: ${{ secrets.STRIPE_TEST_SECRET_KEY }}
          NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: ${{ secrets.STRIPE_TEST_PUBLISHABLE_KEY }}
          STRIPE_WEBHOOK_SECRET: ${{ secrets.STRIPE_TEST_WEBHOOK_SECRET }}

      - name: Wait for server
        run: npx wait-on http://localhost:3000

      - name: Run payment tests
        run: pnpm playwright test payment
        env:
          STRIPE_SECRET_KEY: ${{ secrets.STRIPE_TEST_SECRET_KEY }}
          NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: ${{ secrets.STRIPE_TEST_PUBLISHABLE_KEY }}

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

### Environment Secrets for CI

Add these secrets to your GitHub repository:
- `STRIPE_TEST_SECRET_KEY`
- `STRIPE_TEST_PUBLISHABLE_KEY`
- `STRIPE_TEST_WEBHOOK_SECRET`
- `CLERK_TEST_SECRET_KEY`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`

## Best Practices

### 1. Use Test Mode Only
- **Never** use production Stripe keys in tests
- All test cards only work in test mode
- Test mode data is separate from production

### 2. Clean Up Test Data
- Stripe test mode has no limit on test data
- Periodically clean up old test customers/subscriptions
- Use unique identifiers (timestamps) in test emails

### 3. Test Isolation
- Each test should be independent
- Don't rely on test execution order
- Clean up state between tests

### 4. Realistic Test Data
- Use realistic amounts ($197.00 for lifetime)
- Test with actual product price IDs
- Simulate real user behavior

### 5. Monitor Test Performance
- Keep tests fast (< 30 seconds per test)
- Use parallel execution where possible
- Skip slow tests in development (use `.skip()`)

## Additional Resources

- [Stripe Testing Documentation](https://stripe.com/docs/testing)
- [Playwright Documentation](https://playwright.dev)
- [Stripe Webhook Testing](https://stripe.com/docs/webhooks/test)
- [Clerk Testing Guide](https://clerk.com/docs/testing)

## Support

If you encounter issues:

1. Check the [Troubleshooting](#troubleshooting) section
2. Review test output and screenshots in `test-results/`
3. Run tests in UI mode for visual debugging
4. Check Stripe Dashboard for test mode logs
5. Review webhook event logs in Stripe CLI

## Test Metrics

After implementing these tests, you should achieve:

- **Coverage**: All payment flows (guest, authenticated, failures, webhooks)
- **Reliability**: Tests pass consistently in CI/CD
- **Speed**: Full test suite completes in < 5 minutes
- **Confidence**: Safe to deploy payment changes

## Next Steps

1. **Run Initial Test Suite**
   ```bash
   pnpm test:e2e payment
   ```

2. **Set Up Webhook Testing**
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

3. **Integrate with CI/CD**
   - Add GitHub Actions workflow
   - Configure secrets
   - Enable branch protection

4. **Monitor Test Results**
   - Track test failures
   - Review Playwright reports
   - Update tests as features change

Happy testing! 🚀
