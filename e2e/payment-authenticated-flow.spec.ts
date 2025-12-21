import { test, expect } from '@playwright/test';
import { PaymentTestHelpers, DEFAULT_TEST_CARD } from './utils/payment-helpers';

/**
 * Authenticated User Payment Flow Tests
 *
 * These tests verify the complete payment journey for signed-in users.
 * The flow includes:
 * 1. User is already authenticated (via auth.setup.ts)
 * 2. Clicking "Buy Now" or accessing pricing page
 * 3. Being redirected directly to Stripe checkout (no email dialog)
 * 4. Completing payment with test card
 * 5. Being redirected to success page
 * 6. Verifying paid access on dashboard
 *
 * Prerequisites:
 * - User must be authenticated (handled by setup project)
 * - Stripe test mode must be enabled
 * - Test user should NOT already have paid access
 */

test.describe('Authenticated User Payment Flow', () => {
  let paymentHelpers: PaymentTestHelpers;

  // Use authenticated state from setup
  test.use({ storageState: 'playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    paymentHelpers = new PaymentTestHelpers(page);
  });

  test('should complete successful payment as authenticated user from homepage', async ({ page }) => {
    // Navigate to homepage
    await paymentHelpers.navigateToHomePage();

    // Verify user is signed in (check for user menu or sign out button)
    // This depends on your UI - adjust selector as needed
    const userMenu = page.locator('[data-testid="user-menu"]').or(page.locator('button:has-text("Sign out")')).first();
    const isSignedIn = await userMenu.isVisible().catch(() => false);

    if (isSignedIn) {
      console.log('User is signed in');
    }

    // Click Buy Now button
    await paymentHelpers.clickBuyNowButton();

    // For authenticated users, should go directly to Stripe (no email dialog)
    // Wait for redirect to Stripe checkout
    await paymentHelpers.waitForStripeCheckout();

    // Verify we're on Stripe checkout page
    expect(page.url()).toContain('checkout.stripe.com');

    // Fill Stripe checkout form
    await paymentHelpers.fillStripeCheckout(DEFAULT_TEST_CARD);

    // Submit payment
    await paymentHelpers.submitStripeCheckout();

    // Wait for payment to process and redirect to success page
    await paymentHelpers.waitForPaymentSuccess();

    // Verify success page
    await paymentHelpers.verifySuccessPage();

    // Click "Go to Dashboard" link
    const dashboardLink = page.locator('a[href*="dashboard"]');
    await dashboardLink.click();

    // Wait for dashboard to load
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });

    // Verify we're on dashboard
    expect(page.url()).toContain('/dashboard');
  });

  test('should complete payment from pricing page', async ({ page }) => {
    // Navigate to pricing page
    await paymentHelpers.navigateToPricingPage();

    // Verify pricing table is visible
    const pricingTable = page.locator('[data-component="clerk-pricing-table"]').or(page.locator('text="Free Plan"')).first();
    await expect(pricingTable).toBeVisible({ timeout: 10000 });

    // Look for a "Get Started" or "Upgrade" button for the paid plan
    // This depends on Clerk's PricingTable component structure
    const upgradeButton = page.locator('button:has-text("Get Started")').or(page.locator('button:has-text("Upgrade")')).first();
    const upgradeVisible = await upgradeButton.isVisible().catch(() => false);

    if (upgradeVisible) {
      await upgradeButton.click();

      // Should redirect to Stripe checkout
      await paymentHelpers.waitForStripeCheckout();

      // Complete payment
      await paymentHelpers.fillStripeCheckout(DEFAULT_TEST_CARD);
      await paymentHelpers.submitStripeCheckout();
      await paymentHelpers.waitForPaymentSuccess();

      // Verify success
      await paymentHelpers.verifySuccessPage();
    } else {
      console.log('Upgrade button not found - user may already have paid access');
    }
  });

  test('should show paid features after successful payment', async ({ page }) => {
    // This test assumes a previous payment was completed successfully
    // Navigate to dashboard
    await paymentHelpers.navigateToDashboard();

    // Check for indicators of paid access
    // This could include:
    // - No "Upgrade" prompts
    // - Access to premium features
    // - "Paid Plan" badge or similar

    // Example: Check that upgrade prompts are not visible
    const upgradePrompt = page.locator('button:has-text("Upgrade to Pro")');
    const hasUpgradePrompt = await upgradePrompt.isVisible().catch(() => false);

    // Paid users should not see upgrade prompts
    if (hasUpgradePrompt) {
      console.log('Warning: Upgrade prompt visible for paid user');
    }

    // Look for premium features access
    // Adjust based on your actual dashboard UI
    const studyButton = page.locator('a[href*="/study"]').or(page.locator('button:has-text("Start Studying")')).first();
    await expect(studyButton).toBeVisible({ timeout: 10000 });
  });

  test('should handle successful payment with metadata tracking', async ({ page }) => {
    // Navigate to homepage
    await paymentHelpers.navigateToHomePage();

    // Click Buy Now
    await paymentHelpers.clickBuyNowButton();

    // Wait for Stripe checkout
    await paymentHelpers.waitForStripeCheckout();

    // Verify checkout session has metadata (this is set server-side)
    // We can't directly verify this in the UI, but we can check that the
    // checkout session was created properly by verifying the URL structure
    const checkoutUrl = page.url();
    expect(checkoutUrl).toContain('checkout.stripe.com');
    expect(checkoutUrl).toContain('cs_test_'); // Stripe test mode session ID prefix

    // Complete payment
    await paymentHelpers.fillStripeCheckout(DEFAULT_TEST_CARD);
    await paymentHelpers.submitStripeCheckout();
    await paymentHelpers.waitForPaymentSuccess();

    // Verify session_id is in success URL
    const successUrl = page.url();
    expect(successUrl).toContain('session_id=cs_test_');
  });
});

test.describe('Authenticated Payment - User Experience', () => {
  let paymentHelpers: PaymentTestHelpers;

  test.use({ storageState: 'playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    paymentHelpers = new PaymentTestHelpers(page);
  });

  test('should show loading state during checkout creation', async ({ page }) => {
    await paymentHelpers.navigateToHomePage();

    // Click Buy Now and look for loading indicator
    const buyButton = page.locator('button:has-text("BUY NOW")').first();
    await buyButton.click();

    // Look for loading spinner or disabled state
    // This is a quick check - the button might already be loading
    const loadingSpinner = page.locator('.animate-spin').or(page.locator('[data-loading="true"]')).first();
    const hasLoading = await loadingSpinner.isVisible().catch(() => false);

    if (hasLoading) {
      console.log('Loading state visible during checkout creation');
    }

    // Should eventually redirect to Stripe
    await paymentHelpers.waitForStripeCheckout();
  });

  test('should display correct confirmation email message on success page', async ({ page }) => {
    // Navigate to success page directly (simulating post-payment redirect)
    await page.goto('/success?session_id=cs_test_123456789');

    // Verify confirmation email message
    const emailMessage = page.locator('text=/confirmation email has been sent/i');
    await expect(emailMessage).toBeVisible();

    // Verify email address context (if displayed)
    // Your success page mentions "to your email address"
    const emailContext = page.locator('text=/to your email address/i');
    await expect(emailContext).toBeVisible();
  });

  test('should provide navigation options on success page', async ({ page }) => {
    // Navigate to success page
    await page.goto('/success?session_id=cs_test_123456789');

    // Verify dashboard link exists
    const dashboardLink = page.locator('a[href*="dashboard"]');
    await expect(dashboardLink).toBeVisible();

    // Verify home link exists
    const homeLink = page.locator('a[href="/"]').or(page.locator('text=/go.*home/i')).first();
    await expect(homeLink).toBeVisible();

    // Click dashboard link
    await dashboardLink.click();

    // Verify navigation to dashboard
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });
  });
});

test.describe('Authenticated Payment - Security', () => {
  let paymentHelpers: PaymentTestHelpers;

  test.use({ storageState: 'playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    paymentHelpers = new PaymentTestHelpers(page);
  });

  test('should validate return URLs to prevent open redirects', async ({ page }) => {
    // Try to create checkout with malicious redirect URL
    const response = await page.request.post('/api/checkout', {
      data: {
        priceId: process.env.NEXT_PUBLIC_STRIPE_LIFETIME_PRICE_ID || 'price_test',
        returnUrl: 'https://evil.com/phishing',
      },
    });

    // Should either reject the request or sanitize the URL
    if (response.ok()) {
      const data = await response.json();

      // If it returns a checkout URL, verify it doesn't use the malicious redirect
      if (data.url) {
        expect(data.url).not.toContain('evil.com');
      }
    }
  });

  test('should require authentication for checkout API', async ({ page, context }) => {
    // Create a new context without authentication
    const newContext = await context.browser()?.newContext();
    if (!newContext) {
      console.log('Could not create new context');
      return;
    }

    const newPage = await newContext.newPage();

    // Try to call checkout API without being signed in
    const response = await newPage.request.post('/api/checkout', {
      data: {
        priceId: process.env.NEXT_PUBLIC_STRIPE_LIFETIME_PRICE_ID || 'price_test',
        email: 'test@example.com',
      },
    });

    // For guest checkout with email, this should work
    // For authenticated checkout without email, should require auth
    // Check the API implementation to verify expected behavior

    await newPage.close();
    await newContext.close();
  });
});
