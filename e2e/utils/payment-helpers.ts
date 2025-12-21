import { Page, expect } from '@playwright/test';

/**
 * Stripe test card numbers for different scenarios
 * @see https://stripe.com/docs/testing#cards
 */
export const STRIPE_TEST_CARDS = {
  // Successful payments
  SUCCESS: '4242424242424242',
  SUCCESS_3DS: '4000002500003155', // Requires 3D Secure authentication

  // Failed payments
  DECLINE_GENERIC: '4000000000000002',
  DECLINE_INSUFFICIENT_FUNDS: '4000000000009995',
  DECLINE_LOST_CARD: '4000000000009987',
  DECLINE_STOLEN_CARD: '4000000000009979',
  DECLINE_EXPIRED_CARD: '4000000000000069',
  DECLINE_INCORRECT_CVC: '4000000000000127',
  DECLINE_PROCESSING_ERROR: '4000000000000119',
  DECLINE_INCORRECT_NUMBER: '4242424242424241',
};

/**
 * Test card details for filling Stripe checkout
 */
export interface StripeTestCardDetails {
  number: string;
  expiry: string;
  cvc: string;
  zip: string;
}

export const DEFAULT_TEST_CARD: StripeTestCardDetails = {
  number: STRIPE_TEST_CARDS.SUCCESS,
  expiry: '12/34',
  cvc: '123',
  zip: '12345',
};

/**
 * Helper class for payment flow testing
 */
export class PaymentTestHelpers {
  constructor(private page: Page) {}

  /**
   * Navigate to the home page
   */
  async navigateToHomePage() {
    await this.page.goto('/');
    await this.page.waitForLoadState('domcontentloaded');
  }

  /**
   * Navigate to the pricing page
   */
  async navigateToPricingPage() {
    await this.page.goto('/pricing');
    await this.page.waitForLoadState('domcontentloaded');
  }

  /**
   * Click the "Buy Now" button on the homepage
   */
  async clickBuyNowButton() {
    const buyButton = this.page.locator('button:has-text("BUY NOW")').first();
    await buyButton.waitFor({ state: 'visible', timeout: 10000 });
    await buyButton.click();
  }

  /**
   * Fill email in the guest email dialog
   */
  async fillGuestEmail(email: string) {
    // Wait for the email dialog to appear
    await this.page.waitForSelector('input[type="email"]', { timeout: 5000 });

    // Fill the email
    await this.page.fill('input[type="email"]', email);

    // Click the "Continue to Payment" or similar button
    const continueButton = this.page.locator('button:has-text("Continue")').first();
    await continueButton.click();
  }

  /**
   * Wait for Stripe checkout page to load
   */
  async waitForStripeCheckout() {
    // Wait for redirect to Stripe checkout
    // Stripe checkout URLs contain "checkout.stripe.com"
    await this.page.waitForURL(/checkout\.stripe\.com/, { timeout: 15000 });

    // Wait for the page to be fully loaded
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForTimeout(2000); // Extra time for Stripe elements to initialize
  }

  /**
   * Fill Stripe checkout form with test card details
   */
  async fillStripeCheckout(cardDetails: StripeTestCardDetails = DEFAULT_TEST_CARD) {
    // Wait for Stripe checkout to be ready
    await this.waitForStripeCheckout();

    // Fill email if present (for guest checkout)
    const emailField = this.page.locator('input[type="email"]').first();
    const emailVisible = await emailField.isVisible().catch(() => false);
    if (emailVisible) {
      await emailField.fill('test@example.com');
    }

    // Fill card number
    const cardNumberFrame = this.page.frameLocator('iframe[name*="cardNumber"]').first();
    await cardNumberFrame.locator('input[name="number"]').fill(cardDetails.number);

    // Fill expiry date
    const expiryFrame = this.page.frameLocator('iframe[name*="cardExpiry"]').first();
    await expiryFrame.locator('input[name="expiry"]').fill(cardDetails.expiry);

    // Fill CVC
    const cvcFrame = this.page.frameLocator('iframe[name*="cardCvc"]').first();
    await cvcFrame.locator('input[name="cvc"]').fill(cardDetails.cvc);

    // Fill billing postal code if present
    const postalCodeFrame = this.page.frameLocator('iframe[name*="postalCode"]').first();
    const postalCodeVisible = await postalCodeFrame.locator('input[name="postal"]').isVisible().catch(() => false);
    if (postalCodeVisible) {
      await postalCodeFrame.locator('input[name="postal"]').fill(cardDetails.zip);
    }
  }

  /**
   * Submit the Stripe checkout form
   */
  async submitStripeCheckout() {
    // Click the submit/pay button
    const submitButton = this.page.locator('button[type="submit"]').first();
    await submitButton.click();

    // Wait for processing
    await this.page.waitForTimeout(1000);
  }

  /**
   * Wait for payment success and redirect to success page
   */
  async waitForPaymentSuccess() {
    // Wait for redirect to success page
    await this.page.waitForURL(/\/success/, { timeout: 30000 });

    // Wait for success message
    await this.page.waitForSelector('text="Payment Successful"', { timeout: 10000 });
  }

  /**
   * Verify success page content
   */
  async verifySuccessPage() {
    // Check for success message
    const successMessage = this.page.locator('text="Payment Successful"');
    await expect(successMessage).toBeVisible();

    // Check for confirmation text
    const confirmationText = this.page.locator('text="Thank you for your purchase"');
    await expect(confirmationText).toBeVisible();

    // Check for dashboard link
    const dashboardLink = this.page.locator('a[href*="dashboard"]');
    await expect(dashboardLink).toBeVisible();
  }

  /**
   * Complete full payment flow for guest user
   */
  async completeGuestPayment(
    email: string = 'test@example.com',
    cardDetails: StripeTestCardDetails = DEFAULT_TEST_CARD
  ) {
    await this.clickBuyNowButton();
    await this.fillGuestEmail(email);
    await this.fillStripeCheckout(cardDetails);
    await this.submitStripeCheckout();
    await this.waitForPaymentSuccess();
  }

  /**
   * Complete full payment flow for signed-in user
   */
  async completeSignedInPayment(
    cardDetails: StripeTestCardDetails = DEFAULT_TEST_CARD
  ) {
    await this.clickBuyNowButton();
    await this.fillStripeCheckout(cardDetails);
    await this.submitStripeCheckout();
    await this.waitForPaymentSuccess();
  }

  /**
   * Verify payment failure message
   */
  async verifyPaymentFailure() {
    // Wait for error message to appear
    const errorMessage = this.page.locator('[role="alert"], .error, text=/declined|failed|error/i').first();
    await expect(errorMessage).toBeVisible({ timeout: 10000 });
  }

  /**
   * Navigate to dashboard
   */
  async navigateToDashboard() {
    await this.page.goto('/dashboard');
    await this.page.waitForLoadState('domcontentloaded');
  }

  /**
   * Check if user has paid access on dashboard
   */
  async hasPaidAccess(): Promise<boolean> {
    await this.navigateToDashboard();

    // Look for paid plan indicators
    // This could be premium features, "Go to Dashboard" button, or absence of upgrade prompts
    const upgradePrompt = this.page.locator('button:has-text("Upgrade")');
    const hasUpgradePrompt = await upgradePrompt.isVisible().catch(() => false);

    return !hasUpgradePrompt;
  }

  /**
   * Wait for webhook to process (simulated by waiting for database update)
   */
  async waitForWebhookProcessing(timeoutMs: number = 5000) {
    await this.page.waitForTimeout(timeoutMs);
  }
}

/**
 * Database helper for verifying payment records
 * Note: This would require direct database access in your test environment
 */
export class PaymentDatabaseHelpers {
  /**
   * Verify subscription exists in database
   * This is a placeholder - implement based on your database access method
   */
  static async verifySubscriptionExists(userId: string): Promise<boolean> {
    // TODO: Implement database query to check subscriptions table
    // Example: SELECT * FROM subscriptions WHERE clerk_user_id = ?
    console.log('Verifying subscription for user:', userId);
    return true;
  }

  /**
   * Verify payment record exists in database
   */
  static async verifyPaymentExists(userId: string): Promise<boolean> {
    // TODO: Implement database query to check payments table
    // Example: SELECT * FROM payments WHERE clerk_user_id = ? AND status = 'succeeded'
    console.log('Verifying payment for user:', userId);
    return true;
  }

  /**
   * Clean up test payment data
   */
  static async cleanupTestPayments(userId: string): Promise<void> {
    // TODO: Implement cleanup of test data
    // Example: DELETE FROM subscriptions WHERE clerk_user_id = ?
    // Example: DELETE FROM payments WHERE clerk_user_id = ?
    console.log('Cleaning up test payments for user:', userId);
  }
}

/**
 * Stripe webhook simulation helpers
 */
export class WebhookTestHelpers {
  /**
   * Simulate a Stripe webhook event
   * Note: This requires the Stripe CLI or a custom webhook trigger
   */
  static async triggerWebhookEvent(
    eventType: string,
    payload: any
  ): Promise<void> {
    // TODO: Implement webhook triggering using Stripe CLI
    // stripe trigger [event_type] --override [data]
    console.log('Triggering webhook event:', eventType, payload);
  }

  /**
   * Trigger checkout.session.completed event
   */
  static async triggerCheckoutCompleted(sessionId: string): Promise<void> {
    await this.triggerWebhookEvent('checkout.session.completed', {
      id: sessionId,
    });
  }

  /**
   * Trigger payment_intent.succeeded event
   */
  static async triggerPaymentSucceeded(paymentIntentId: string): Promise<void> {
    await this.triggerWebhookEvent('payment_intent.succeeded', {
      id: paymentIntentId,
    });
  }

  /**
   * Trigger payment_intent.payment_failed event
   */
  static async triggerPaymentFailed(paymentIntentId: string): Promise<void> {
    await this.triggerWebhookEvent('payment_intent.payment_failed', {
      id: paymentIntentId,
    });
  }
}
