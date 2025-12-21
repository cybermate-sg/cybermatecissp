import { Resend } from 'resend';

// Lazy initialization to avoid build-time errors
let resendClient: Resend | null = null;

function getResendClient(): Resend {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error('RESEND_API_KEY environment variable is not set');
      throw new Error('RESEND_API_KEY environment variable is not set');
    }
    console.log('Initializing Resend client with API key:', apiKey.substring(0, 10) + '...');
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

export const resend = {
  get emails() {
    return getResendClient().emails;
  }
};

/**
 * Email configuration
 *
 * NOTE: Update the 'from' email address to your verified domain
 */
export const EmailConfig = {
  from: 'Cybermate Professional Training Support <noreply@cybermateconsulting.com>', // Update with your verified domain
  replyTo: 'support@cybermateconsulting.com', // Your support email
  adminNotificationSubject: 'New User Feedback Received',
  userResolvedSubject: 'Your Feedback Has Been Reviewed',
} as const;
