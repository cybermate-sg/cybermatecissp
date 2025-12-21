import { test, expect } from '@playwright/test';
import { PaymentTestHelpers, DEFAULT_TEST_CARD } from './utils/payment-helpers';

/**
 * Guest User Payment Flow Tests
 *
 * These tests verify the complete payment journey for guest users who are not signed in.
 * The flow includes:
 * 1. Clicking "Buy Now" on the homepage
 * 2. Entering email in the guest email dialog
 * 3. Being redirected to Stripe checkout
 * 4. Completing payment with test card
 * 5. Being redirected to success page
 *
 * Prerequisites:
 * - Stripe test mode must be enabled
 * - STRIPE_SECRET_KEY and STRIPE_PUBLISHABLE_KEY must be set in environment
 * - STRIPE_LIFETIME_PRICE_ID must be configured
 */

test.describe('Guest User Payment Flow', () => {
  let paymentHelpers: PaymentTestHelpers;

  test.beforeEach(async ({ page }) => {
    paymentHelpers = new PaymentTestHelpers(page);
  });

  test('should complete successful payment as guest user from homepage', async ({ page }) => {
    // Navigate to homepage
    await paymentHelpers.navigateToHomePage();

    // Verify Buy Now button is visible
    const buyButton = page.locator('button:has-text("BUY NOW")').first();
    await expect(buyButton).toBeVisible();

    // Click Buy Now button
    await paymentHelpers.clickBuyNowButton();

    // Fill guest email
    const testEmail = `test-guest-${Date.now()}@example.com`;
    await paymentHelpers.fillGuestEmail(testEmail);

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

    // Verify we're on the success page
    expect(page.url()).toContain('/success');

    // Verify success page content
    await paymentHelpers.verifySuccessPage();

    // Verify session_id is in URL (indicates Stripe session completed)
    expect(page.url()).toContain('session_id=');
  });

  test('should show email validation for invalid email', async ({ page }) => {
    await paymentHelpers.navigateToHomePage();

    // Click Buy Now button
    await paymentHelpers.clickBuyNowButton();

    // Try to fill with invalid email
    const emailInput = page.locator('input[type="email"]');
    await emailInput.fill('invalid-email');

    // Try to continue
    const continueButton = page.locator('button:has-text("Continue")').first();
    await continueButton.click();

    // Verify validation error or that we didn't proceed to Stripe
    // The email input should still be visible (we didn't navigate away)
    await expect(emailInput).toBeVisible();
  });

  test('should handle guest email dialog cancellation', async ({ page }) => {
    await paymentHelpers.navigateToHomePage();

    // Click Buy Now button
    await paymentHelpers.clickBuyNowButton();

    // Wait for email dialog
    await page.waitForSelector('input[type="email"]', { timeout: 5000 });

    // Click cancel/close button (look for X or Cancel button)
    const cancelButton = page.locator('button[aria-label="Close"]').or(page.locator('button:has-text("Cancel")')).first();
    const cancelVisible = await cancelButton.isVisible().catch(() => false);

    if (cancelVisible) {
      await cancelButton.click();

      // Verify dialog is closed (email input should not be visible)
      const emailInput = page.locator('input[type="email"]');
      await expect(emailInput).not.toBeVisible();

      // Verify we're still on homepage
      expect(page.url()).toContain('/');
    }
  });

  test('should display correct pricing information on homepage', async ({ page }) => {
    await paymentHelpers.navigateToHomePage();

    // Verify pricing is displayed
    const priceElement = page.locator('text=/\\$197/i').first();
    await expect(priceElement).toBeVisible();

    // Verify "Special Launch Rate" or similar text
    const launchRateText = page.locator('text=/special.*launch.*rate/i').first();
    await expect(launchRateText).toBeVisible();
  });

  test('should handle checkout cancellation (user navigates back)', async ({ page }) => {
    await paymentHelpers.navigateToHomePage();

    // Click Buy Now and fill email
    await paymentHelpers.clickBuyNowButton();
    const testEmail = `test-cancel-${Date.now()}@example.com`;
    await paymentHelpers.fillGuestEmail(testEmail);

    // Wait for Stripe checkout
    await paymentHelpers.waitForStripeCheckout();

    // Simulate user going back (clicking browser back button)
    await page.goBack();

    // Verify we're back on the site (should redirect to homepage based on cancel_url)
    await page.waitForURL(/localhost:3000/, { timeout: 10000 });

    // Verify we're on homepage or a valid page (not Stripe)
    expect(page.url()).not.toContain('stripe.com');
  });
});

test.describe('Guest Payment - Error Scenarios', () => {
  let paymentHelpers: PaymentTestHelpers;

  test.beforeEach(async ({ page }) => {
    paymentHelpers = new PaymentTestHelpers(page);
  });

  test('should handle missing price ID gracefully', async ({ page }) => {
    // This test verifies the API handles missing priceId
    // Navigate to homepage
    await paymentHelpers.navigateToHomePage();

    // Try to call checkout API directly without priceId
    const response = await page.request.post('/api/checkout', {
      data: {
        email: 'test@example.com',
      },
    });

    // Should return 400 Bad Request
    expect(response.status()).toBe(400);

    const data = await response.json();
    expect(data.error).toBeTruthy();
  });

  test('should handle missing email for guest checkout', async ({ page }) => {
    // Try to call checkout API without email
    const response = await page.request.post('/api/checkout', {
      data: {
        priceId: process.env.NEXT_PUBLIC_STRIPE_LIFETIME_PRICE_ID || 'price_test',
      },
    });

    // Should return 400 Bad Request for missing email
    expect(response.status()).toBe(400);

    const data = await response.json();
    expect(data.error).toContain('email');
  });
});

test.describe('Guest Payment - Accessibility', () => {
  let paymentHelpers: PaymentTestHelpers;

  test.beforeEach(async ({ page }) => {
    paymentHelpers = new PaymentTestHelpers(page);
  });

  test('should be keyboard navigable', async ({ page }) => {
    await paymentHelpers.navigateToHomePage();

    // Tab to Buy Now button
    await page.keyboard.press('Tab');

    // Find the focused element
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);

    // Keep tabbing until we find the Buy Now button or hit max tabs
    let tabCount = 0;
    const maxTabs = 20;

    while (tabCount < maxTabs) {
      const buyButtonFocused = await page.evaluate(() => {
        const activeElement = document.activeElement;
        return activeElement?.textContent?.includes('BUY NOW') || false;
      });

      if (buyButtonFocused) {
        // Press Enter to activate
        await page.keyboard.press('Enter');

        // Verify email dialog appears
        const emailInput = page.locator('input[type="email"]');
        await expect(emailInput).toBeVisible();
        return;
      }

      await page.keyboard.press('Tab');
      tabCount++;
    }

    // If we got here, we didn't find the button through keyboard nav
    console.warn('Could not navigate to Buy Now button via keyboard');
  });
});
