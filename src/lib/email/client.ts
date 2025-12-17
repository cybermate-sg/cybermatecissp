import { Resend } from 'resend';

if (!process.env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY environment variable is not set');
}

export const resend = new Resend(process.env.RESEND_API_KEY);

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
