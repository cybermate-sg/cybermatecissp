/**
 * Email template for successful payment notification
 */

interface PaymentSuccessProps {
  userName: string;
  userEmail: string;
  amount: number;
  currency: string;
  paymentIntentId: string;
  dashboardUrl?: string;
}

export function getPaymentSuccessHtml(props: PaymentSuccessProps): string {
  const { userName, amount, currency, paymentIntentId, dashboardUrl } = props;

  // Format amount (Stripe amounts are in cents)
  const formattedAmount = (amount / 100).toFixed(2);
  const currencySymbol = currency.toUpperCase() === 'USD' ? '$' : currency.toUpperCase();

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
          }
          .container {
            background-color: #ffffff;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .success-icon {
            font-size: 48px;
            margin-bottom: 16px;
          }
          h1 {
            color: #059669;
            margin-top: 0;
            font-size: 28px;
            text-align: center;
          }
          .amount {
            text-align: center;
            font-size: 36px;
            font-weight: bold;
            color: #7c3aed;
            margin: 20px 0;
          }
          .info-box {
            background-color: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #e5e7eb;
          }
          .info-row:last-child {
            border-bottom: none;
          }
          .info-label {
            font-weight: 600;
            color: #6b7280;
          }
          .info-value {
            color: #1f2937;
          }
          .cta-button {
            display: inline-block;
            background: linear-gradient(to right, #7c3aed, #6d28d9);
            color: #ffffff !important;
            text-decoration: none;
            padding: 16px 32px;
            border-radius: 8px;
            font-weight: 700;
            font-size: 16px;
            text-align: center;
            margin: 20px 0;
            box-shadow: 0 4px 6px rgba(124, 58, 237, 0.3);
          }
          .cta-button:hover {
            background: linear-gradient(to right, #6d28d9, #5b21b6);
            box-shadow: 0 6px 8px rgba(124, 58, 237, 0.4);
          }
          .features-list {
            background-color: #ecfdf5;
            border-left: 4px solid #059669;
            padding: 20px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .features-list ul {
            margin: 10px 0;
            padding-left: 20px;
          }
          .features-list li {
            margin: 8px 0;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 12px;
            color: #6b7280;
            text-align: center;
          }
          .button-container {
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="success-icon">🎉</div>
            <h1>Payment Successful!</h1>
          </div>

          <p>Hi ${userName || 'there'},</p>

          <p>Thank you for your purchase! Your payment has been successfully processed and you now have full access to CISSP Mastery.</p>

          <div class="amount">
            ${currencySymbol}${formattedAmount} ${currency.toUpperCase()}
          </div>

          <div class="info-box">
            <div class="info-row">
              <span class="info-label">Payment ID</span>
              <span class="info-value">${paymentIntentId}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Status</span>
              <span class="info-value" style="color: #059669; font-weight: 600;">✓ Paid</span>
            </div>
          </div>

          <div class="features-list">
            <strong>What's included in your access:</strong>
            <ul>
              <li><strong>500+ Flashcards</strong> - Battle-tested and hand-curated content</li>
              <li><strong>1000+ Practice Questions</strong> - First-attempt proven strategies</li>
              <li><strong>Official CBK References</strong> - Everything you need to succeed</li>
              <li><strong>12 Months Full Access</strong> - All future updates included</li>
            </ul>
          </div>

          ${
            dashboardUrl
              ? `
          <div class="button-container">
            <a href="${dashboardUrl}" class="cta-button">Access Your Dashboard →</a>
          </div>
          `
              : ''
          }

          <p>We're excited to have you on board and can't wait to help you pass CISSP on your first attempt!</p>

          <p>If you have any questions or need assistance, don't hesitate to reach out to our support team.</p>

          <div class="footer">
            <p><strong>Cybermate Professional Training</strong></p>
            <p>Questions? Contact us at support@cybermateconsulting.com</p>
            <p style="margin-top: 16px; color: #9ca3af;">
              This is a confirmation email for your payment. Please keep this for your records.
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Get plain text version
 */
export function getPaymentSuccessText(props: PaymentSuccessProps): string {
  const { userName, amount, currency, paymentIntentId, dashboardUrl } = props;

  // Format amount (Stripe amounts are in cents)
  const formattedAmount = (amount / 100).toFixed(2);
  const currencySymbol = currency.toUpperCase() === 'USD' ? '$' : currency.toUpperCase();

  return `
Payment Successful!

Hi ${userName || 'there'},

Thank you for your purchase! Your payment has been successfully processed and you now have full access to CISSP Mastery.

Amount Paid: ${currencySymbol}${formattedAmount} ${currency.toUpperCase()}
Payment ID: ${paymentIntentId}
Status: ✓ Paid

What's included in your access:
- 500+ Flashcards - Battle-tested and hand-curated content
- 1000+ Practice Questions - First-attempt proven strategies
- Official CBK References - Everything you need to succeed
- 12 Months Full Access - All future updates included

${dashboardUrl ? `Access your dashboard: ${dashboardUrl}` : ''}

We're excited to have you on board and can't wait to help you pass CISSP on your first attempt!

If you have any questions or need assistance, don't hesitate to reach out to our support team.

---
Cybermate Professional Training
Questions? Contact us at support@cybermateconsulting.com

This is a confirmation email for your payment. Please keep this for your records.
  `.trim();
}
