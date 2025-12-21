import { resend, EmailConfig } from './client';
import {
  getPaymentSuccessHtml,
  getPaymentSuccessText,
} from './templates/payment-success';

interface SendPaymentSuccessEmailParams {
  userEmail: string;
  userName: string;
  amount: number;
  currency: string;
  paymentIntentId: string;
  dashboardUrl?: string;
}

/**
 * Send payment success email to user
 */
export async function sendPaymentSuccessEmail(
  params: SendPaymentSuccessEmailParams
): Promise<{ success: boolean; error?: string }> {
  try {
    const { userEmail, userName, amount, currency, paymentIntentId, dashboardUrl } = params;

    // Format amount for display
    const formattedAmount = (amount / 100).toFixed(2);
    const currencySymbol = currency.toUpperCase() === 'USD' ? '$' : currency.toUpperCase();

    await resend.emails.send({
      from: EmailConfig.from,
      to: userEmail,
      replyTo: EmailConfig.replyTo,
      subject: `🎉 Payment Successful - Welcome to CISSP Mastery!`,
      html: getPaymentSuccessHtml({
        userName,
        userEmail,
        amount,
        currency,
        paymentIntentId,
        dashboardUrl,
      }),
      text: getPaymentSuccessText({
        userName,
        userEmail,
        amount,
        currency,
        paymentIntentId,
        dashboardUrl,
      }),
    });

    console.log(
      `Payment success email sent to ${userEmail} for ${currencySymbol}${formattedAmount} ${currency.toUpperCase()}`
    );

    return { success: true };
  } catch (error) {
    console.error('Failed to send payment success email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send payment failure email to user
 */
export async function sendPaymentFailureEmail(params: {
  userEmail: string;
  userName: string;
  amount: number;
  currency: string;
  paymentIntentId: string;
  failureReason?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { userEmail, userName, amount, currency, paymentIntentId, failureReason } = params;

    const formattedAmount = (amount / 100).toFixed(2);
    const currencySymbol = currency.toUpperCase() === 'USD' ? '$' : currency.toUpperCase();

    await resend.emails.send({
      from: EmailConfig.from,
      to: userEmail,
      replyTo: EmailConfig.replyTo,
      subject: 'Payment Failed - CISSP Mastery',
      html: `
        <!DOCTYPE html>
        <html>
          <body style="font-family: sans-serif; padding: 20px;">
            <h2>Payment Failed</h2>
            <p>Hi ${userName || 'there'},</p>
            <p>We were unable to process your payment of ${currencySymbol}${formattedAmount} ${currency.toUpperCase()}.</p>
            ${failureReason ? `<p><strong>Reason:</strong> ${failureReason}</p>` : ''}
            <p>Payment ID: ${paymentIntentId}</p>
            <p>Please try again or contact your card issuer for more information.</p>
            <p>If you need assistance, please contact us at ${EmailConfig.replyTo}</p>
          </body>
        </html>
      `,
      text: `Payment Failed\n\nHi ${userName || 'there'},\n\nWe were unable to process your payment of ${currencySymbol}${formattedAmount} ${currency.toUpperCase()}.\n\n${failureReason ? `Reason: ${failureReason}\n\n` : ''}Payment ID: ${paymentIntentId}\n\nPlease try again or contact your card issuer for more information.\n\nIf you need assistance, please contact us at ${EmailConfig.replyTo}`,
    });

    console.log(`Payment failure email sent to ${userEmail}`);

    return { success: true };
  } catch (error) {
    console.error('Failed to send payment failure email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
