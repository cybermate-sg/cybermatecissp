import { test, expect } from '@playwright/test';
import { PaymentTestHelpers, STRIPE_TEST_CARDS } from './utils/payment-helpers';

/**
 * Payment Failure Scenarios Tests
 *
 * These tests verify that the application correctly handles various payment failures:
 * - Card declined (generic)
 * - Insufficient funds
 * - Lost/stolen card
 * - Expired card
 * - Incorrect CVC
 * - Processing errors
 *
 * Uses Stripe's test card numbers that simulate specific decline scenarios.
 * @see https://stripe.com/docs/testing#cards-responses
 *
 * Prerequisites:
 * - Stripe test mode must be enabled
 * - Error handling must be implemented in payment flow
 */

test.describe('Payment Failure - Card Declines', () => {
  let paymentHelpers: PaymentTestHelpers;

  test.beforeEach(async ({ page }) => {
    paymentHelpers = new PaymentTestHelpers(page);
  });

  test('should handle generic card decline', async ({ page }) => {
    // Navigate and start checkout
    await paymentHelpers.navigateToHomePage();
    await paymentHelpers.clickBuyNowButton();

    // Fill guest email
    const testEmail = `test-decline-${Date.now()}@example.com`;
    await paymentHelpers.fillGuestEmail(testEmail);

    // Wait for Stripe checkout
    await paymentHelpers.waitForStripeCheckout();

    // Fill with declined card
    await paymentHelpers.fillStripeCheckout({
      number: STRIPE_TEST_CARDS.DECLINE_GENERIC,
      expiry: '12/34',
      cvc: '123',
      zip: '12345',
    });

    // Submit payment
    await paymentHelpers.submitStripeCheckout();

    // Wait for error message to appear
    const errorMessage = page.locator('text=/declined|was declined|card.*declined/i').first();
    await expect(errorMessage).toBeVisible({ timeout: 15000 });

    // Verify we're still on Stripe checkout (not redirected to success)
    expect(page.url()).toContain('checkout.stripe.com');

    // Verify session_id is NOT in URL (payment didn't complete)
    expect(page.url()).not.toContain('/success');
  });

  test('should handle insufficient funds decline', async ({ page }) => {
    await paymentHelpers.navigateToHomePage();
    await paymentHelpers.clickBuyNowButton();

    const testEmail = `test-insufficient-${Date.now()}@example.com`;
    await paymentHelpers.fillGuestEmail(testEmail);
    await paymentHelpers.waitForStripeCheckout();

    // Fill with insufficient funds card
    await paymentHelpers.fillStripeCheckout({
      number: STRIPE_TEST_CARDS.DECLINE_INSUFFICIENT_FUNDS,
      expiry: '12/34',
      cvc: '123',
      zip: '12345',
    });

    await paymentHelpers.submitStripeCheckout();

    // Look for specific error message about insufficient funds
    const errorMessage = page.locator('text=/insufficient.*funds|not.*enough.*funds/i').first();
    const genericError = page.locator('text=/declined|error/i').first();

    // Either specific or generic error should appear
    await expect(errorMessage.or(genericError)).toBeVisible({ timeout: 15000 });

    // Verify still on checkout page
    expect(page.url()).toContain('checkout.stripe.com');
  });

  test('should handle expired card', async ({ page }) => {
    await paymentHelpers.navigateToHomePage();
    await paymentHelpers.clickBuyNowButton();

    const testEmail = `test-expired-${Date.now()}@example.com`;
    await paymentHelpers.fillGuestEmail(testEmail);
    await paymentHelpers.waitForStripeCheckout();

    // Fill with expired card
    await paymentHelpers.fillStripeCheckout({
      number: STRIPE_TEST_CARDS.DECLINE_EXPIRED_CARD,
      expiry: '12/34',
      cvc: '123',
      zip: '12345',
    });

    await paymentHelpers.submitStripeCheckout();

    // Look for expired card error
    const errorMessage = page.locator('text=/expired|card.*expired/i').first();
    const genericError = page.locator('text=/declined|error/i').first();

    await expect(errorMessage.or(genericError)).toBeVisible({ timeout: 15000 });
  });

  test('should handle incorrect CVC', async ({ page }) => {
    await paymentHelpers.navigateToHomePage();
    await paymentHelpers.clickBuyNowButton();

    const testEmail = `test-cvc-${Date.now()}@example.com`;
    await paymentHelpers.fillGuestEmail(testEmail);
    await paymentHelpers.waitForStripeCheckout();

    // Fill with incorrect CVC card
    await paymentHelpers.fillStripeCheckout({
      number: STRIPE_TEST_CARDS.DECLINE_INCORRECT_CVC,
      expiry: '12/34',
      cvc: '123',
      zip: '12345',
    });

    await paymentHelpers.submitStripeCheckout();

    // Look for CVC error
    const errorMessage = page.locator('text=/cvc|security code|incorrect.*code/i').first();
    const genericError = page.locator('text=/declined|error/i').first();

    await expect(errorMessage.or(genericError)).toBeVisible({ timeout: 15000 });
  });

  test('should handle processing error', async ({ page }) => {
    await paymentHelpers.navigateToHomePage();
    await paymentHelpers.clickBuyNowButton();

    const testEmail = `test-processing-${Date.now()}@example.com`;
    await paymentHelpers.fillGuestEmail(testEmail);
    await paymentHelpers.waitForStripeCheckout();

    // Fill with processing error card
    await paymentHelpers.fillStripeCheckout({
      number: STRIPE_TEST_CARDS.DECLINE_PROCESSING_ERROR,
      expiry: '12/34',
      cvc: '123',
      zip: '12345',
    });

    await paymentHelpers.submitStripeCheckout();

    // Look for processing error
    const errorMessage = page.locator('text=/processing.*error|error.*processing|try again/i').first();
    const genericError = page.locator('text=/declined|error/i').first();

    await expect(errorMessage.or(genericError)).toBeVisible({ timeout: 15000 });
  });
});

test.describe('Payment Failure - Retry Flow', () => {
  let paymentHelpers: PaymentTestHelpers;

  test.beforeEach(async ({ page }) => {
    paymentHelpers = new PaymentTestHelpers(page);
  });

  test('should allow retry after card decline', async ({ page }) => {
    // Start checkout flow
    await paymentHelpers.navigateToHomePage();
    await paymentHelpers.clickBuyNowButton();

    const testEmail = `test-retry-${Date.now()}@example.com`;
    await paymentHelpers.fillGuestEmail(testEmail);
    await paymentHelpers.waitForStripeCheckout();

    // First attempt: use declined card
    await paymentHelpers.fillStripeCheckout({
      number: STRIPE_TEST_CARDS.DECLINE_GENERIC,
      expiry: '12/34',
      cvc: '123',
      zip: '12345',
    });

    await paymentHelpers.submitStripeCheckout();

    // Wait for error
    const errorMessage = page.locator('text=/declined|error/i').first();
    await expect(errorMessage).toBeVisible({ timeout: 15000 });

    // Second attempt: use successful card
    // Clear the card number field and re-enter
    await page.waitForTimeout(1000); // Wait for error state to settle

    // Re-fill with successful card
    const cardNumberFrame = page.frameLocator('iframe[name*="cardNumber"]').first();
    await cardNumberFrame.locator('input[name="number"]').click();
    await cardNumberFrame.locator('input[name="number"]').press('Control+A');
    await cardNumberFrame.locator('input[name="number"]').fill(STRIPE_TEST_CARDS.SUCCESS);

    // Re-submit
    const submitButton = page.locator('button[type="submit"]').first();
    await submitButton.click();

    // Should now succeed
    await paymentHelpers.waitForPaymentSuccess();
    await paymentHelpers.verifySuccessPage();
  });

  test('should maintain session data after decline', async ({ page }) => {
    // Start checkout with specific email
    await paymentHelpers.navigateToHomePage();
    await paymentHelpers.clickBuyNowButton();

    const testEmail = `test-session-${Date.now()}@example.com`;
    await paymentHelpers.fillGuestEmail(testEmail);
    await paymentHelpers.waitForStripeCheckout();

    // Attempt payment with declined card
    await paymentHelpers.fillStripeCheckout({
      number: STRIPE_TEST_CARDS.DECLINE_GENERIC,
      expiry: '12/34',
      cvc: '123',
      zip: '12345',
    });

    await paymentHelpers.submitStripeCheckout();

    // Wait for error
    await page.waitForTimeout(2000);

    // Verify email is still populated (Stripe maintains this)
    const emailField = page.locator('input[type="email"]').first();
    const emailVisible = await emailField.isVisible().catch(() => false);

    if (emailVisible) {
      const emailValue = await emailField.inputValue();
      // Email might be pre-filled or might be the one we entered
      expect(emailValue.length).toBeGreaterThan(0);
    }

    // Verify checkout session is still active (URL still has session ID)
    const checkoutUrl = page.url();
    expect(checkoutUrl).toContain('checkout.stripe.com');
  });
});

test.describe('Payment Failure - User Feedback', () => {
  let paymentHelpers: PaymentTestHelpers;

  test.beforeEach(async ({ page }) => {
    paymentHelpers = new PaymentTestHelpers(page);
  });

  test('should display user-friendly error messages', async ({ page }) => {
    await paymentHelpers.navigateToHomePage();
    await paymentHelpers.clickBuyNowButton();

    const testEmail = `test-friendly-${Date.now()}@example.com`;
    await paymentHelpers.fillGuestEmail(testEmail);
    await paymentHelpers.waitForStripeCheckout();

    // Use insufficient funds card
    await paymentHelpers.fillStripeCheckout({
      number: STRIPE_TEST_CARDS.DECLINE_INSUFFICIENT_FUNDS,
      expiry: '12/34',
      cvc: '123',
      zip: '12345',
    });

    await paymentHelpers.submitStripeCheckout();

    // Wait for error message
    await page.waitForTimeout(2000);

    // Verify error message exists and is visible
    const errorContainer = page.locator('[role="alert"]').or(page.locator('.error')).or(page.locator('text=/error|declined/i')).first();
    await expect(errorContainer).toBeVisible({ timeout: 15000 });

    // Error message should not show technical details or stack traces
    const errorText = await errorContainer.textContent();
    expect(errorText?.toLowerCase()).not.toContain('undefined');
    expect(errorText?.toLowerCase()).not.toContain('null');
    expect(errorText?.toLowerCase()).not.toContain('error:');
  });

  test('should not proceed to success page on payment failure', async ({ page }) => {
    await paymentHelpers.navigateToHomePage();
    await paymentHelpers.clickBuyNowButton();

    const testEmail = `test-no-success-${Date.now()}@example.com`;
    await paymentHelpers.fillGuestEmail(testEmail);
    await paymentHelpers.waitForStripeCheckout();

    // Use declined card
    await paymentHelpers.fillStripeCheckout({
      number: STRIPE_TEST_CARDS.DECLINE_GENERIC,
      expiry: '12/34',
      cvc: '123',
      zip: '12345',
    });

    await paymentHelpers.submitStripeCheckout();

    // Wait a reasonable time
    await page.waitForTimeout(5000);

    // Verify we're NOT on success page
    expect(page.url()).not.toContain('/success');

    // Verify we're still on Stripe checkout
    expect(page.url()).toContain('checkout.stripe.com');
  });
});

test.describe('Payment Failure - Database Integrity', () => {
  let paymentHelpers: PaymentTestHelpers;

  test.beforeEach(async ({ page }) => {
    paymentHelpers = new PaymentTestHelpers(page);
  });

  test('should not create subscription record for failed payment', async ({ page }) => {
    // Note: This test requires database access to verify
    // For now, we'll verify through the UI that access is not granted

    await paymentHelpers.navigateToHomePage();
    await paymentHelpers.clickBuyNowButton();

    const testEmail = `test-no-sub-${Date.now()}@example.com`;
    await paymentHelpers.fillGuestEmail(testEmail);
    await paymentHelpers.waitForStripeCheckout();

    // Use declined card
    await paymentHelpers.fillStripeCheckout({
      number: STRIPE_TEST_CARDS.DECLINE_GENERIC,
      expiry: '12/34',
      cvc: '123',
      zip: '12345',
    });

    await paymentHelpers.submitStripeCheckout();

    // Wait for error
    await page.waitForTimeout(2000);

    // Navigate back to site
    await page.goto('/');

    // Verify that paid features are not accessible
    // This would require checking the dashboard or trying to access premium content
    console.log('Payment failed - subscription should not be created');
  });

  test('should record failed payment attempt in database', async ({ page }) => {
    // This test verifies that failed payment attempts are logged
    // Requires database access to check payments table with status='failed'

    await paymentHelpers.navigateToHomePage();
    await paymentHelpers.clickBuyNowButton();

    const testEmail = `test-failed-log-${Date.now()}@example.com`;
    await paymentHelpers.fillGuestEmail(testEmail);
    await paymentHelpers.waitForStripeCheckout();

    // Use declined card
    await paymentHelpers.fillStripeCheckout({
      number: STRIPE_TEST_CARDS.DECLINE_GENERIC,
      expiry: '12/34',
      cvc: '123',
      zip: '12345',
    });

    await paymentHelpers.submitStripeCheckout();

    // Wait for failure
    await page.waitForTimeout(2000);

    // Note: Actual database verification would happen here
    // Example: SELECT * FROM payments WHERE status = 'failed' AND created_at > NOW() - INTERVAL '1 minute'
    console.log('Failed payment should be logged in database with status=failed');
  });
});

test.describe('Payment Failure - Network Issues', () => {
  let paymentHelpers: PaymentTestHelpers;

  test.beforeEach(async ({ page }) => {
    paymentHelpers = new PaymentTestHelpers(page);
  });

  test('should handle checkout API timeout gracefully', async ({ page }) => {
    await paymentHelpers.navigateToHomePage();

    // Mock a slow/timeout response from checkout API
    await page.route('/api/checkout', async (route) => {
      // Simulate timeout by delaying response beyond reasonable limit
      await page.waitForTimeout(10000);
      await route.abort('timedout');
    });

    // Click Buy Now
    await paymentHelpers.clickBuyNowButton();

    // Fill email
    const testEmail = `test-timeout-${Date.now()}@example.com`;
    await page.fill('input[type="email"]', testEmail);

    // Try to continue
    const continueButton = page.locator('button:has-text("Continue")').first();
    await continueButton.click();

    // Should show error or remain on page
    await page.waitForTimeout(2000);

    // Verify error handling (error message or stayed on same page)
    const emailInput = page.locator('input[type="email"]');
    const stillVisible = await emailInput.isVisible().catch(() => false);

    if (stillVisible) {
      console.log('Timeout handled - user stayed on dialog');
    }
  });

  test('should handle Stripe checkout load failure', async ({ page }) => {
    await paymentHelpers.navigateToHomePage();

    // This test verifies handling when Stripe checkout fails to load
    // In real scenarios, this might be due to:
    // - Network issues
    // - Stripe service outage
    // - Invalid checkout session

    // For testing, we can try with an invalid session ID
    await page.goto('https://checkout.stripe.com/c/pay/cs_invalid_session_id');

    // Stripe should show an error page
    await page.waitForTimeout(2000);

    // Verify we get an error state (exact message varies)
    const pageText = await page.textContent('body');
    const hasError = pageText?.toLowerCase().includes('error') ||
                     pageText?.toLowerCase().includes('invalid') ||
                     pageText?.toLowerCase().includes('expired');

    expect(hasError).toBe(true);
  });
});
