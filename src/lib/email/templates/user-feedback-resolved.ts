/**
 * Email template for user feedback resolved notification
 */

interface UserFeedbackResolvedProps {
  userName: string;
  feedbackType: string;
  feedbackText: string;
  adminResponse: string | null;
  status: string;
  contentType: 'flashcard' | 'flashcard_quiz' | 'deck_quiz';
  contentPreview: string;
}

export function getUserFeedbackResolvedHtml(
  props: UserFeedbackResolvedProps
): string {
  const {
    userName,
    feedbackType,
    feedbackText,
    adminResponse,
    status,
    contentType,
    contentPreview,
  } = props;

  const feedbackTypeLabel = feedbackType
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  const contentTypeLabel =
    contentType === 'flashcard'
      ? 'Flashcard'
      : contentType === 'flashcard_quiz'
      ? 'Flashcard Quiz Question'
      : 'Deck Quiz Question';

  const statusLabel = status.charAt(0).toUpperCase() + status.slice(1);

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
          h1 {
            color: #059669;
            margin-top: 0;
            font-size: 24px;
          }
          .badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            margin-bottom: 16px;
            background-color: #d1fae5;
            color: #065f46;
          }
          .info-row {
            margin: 12px 0;
            padding: 8px 0;
            border-bottom: 1px solid #e5e7eb;
          }
          .info-label {
            font-weight: 600;
            color: #6b7280;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .info-value {
            margin-top: 4px;
            color: #1f2937;
          }
          .feedback-text {
            background-color: #f9fafb;
            border-left: 4px solid #6b7280;
            padding: 16px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .admin-response {
            background-color: #ecfdf5;
            border-left: 4px solid #059669;
            padding: 16px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .content-preview {
            background-color: #fafafa;
            padding: 12px;
            border-radius: 4px;
            margin: 12px 0;
            font-size: 14px;
            color: #555;
            border: 1px solid #e5e7eb;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 12px;
            color: #6b7280;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>✅ Your Feedback Has Been Reviewed</h1>

          <p>Hi ${userName || 'there'},</p>

          <p>Thank you for taking the time to provide feedback. Our team has reviewed your submission and it has been marked as <strong>${statusLabel}</strong>.</p>

          <span class="badge">${feedbackTypeLabel}</span>

          <div class="info-row">
            <div class="info-label">Regarding</div>
            <div class="info-value">${contentTypeLabel}</div>
          </div>

          <div class="info-row">
            <div class="info-label">Content</div>
            <div class="content-preview">${contentPreview}</div>
          </div>

          <div class="feedback-text">
            <div class="info-label" style="margin-bottom: 8px;">Your Feedback</div>
            ${feedbackText}
          </div>

          ${
            adminResponse
              ? `
            <div class="admin-response">
              <div class="info-label" style="margin-bottom: 8px;">Response from Our Team</div>
              ${adminResponse}
            </div>
          `
              : ''
          }

          <p>We appreciate your help in making CISSP Mastery better for everyone!</p>

          <div class="footer">
            <p>
              If you have any questions, please reply to this email or contact us at support@cisspmastery.com.
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
export function getUserFeedbackResolvedText(
  props: UserFeedbackResolvedProps
): string {
  const {
    userName,
    feedbackType,
    feedbackText,
    adminResponse,
    status,
    contentType,
    contentPreview,
  } = props;

  const feedbackTypeLabel = feedbackType
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  const contentTypeLabel =
    contentType === 'flashcard'
      ? 'Flashcard'
      : contentType === 'flashcard_quiz'
      ? 'Flashcard Quiz Question'
      : 'Deck Quiz Question';

  const statusLabel = status.charAt(0).toUpperCase() + status.slice(1);

  return `
Your Feedback Has Been Reviewed

Hi ${userName || 'there'},

Thank you for taking the time to provide feedback. Our team has reviewed your submission and it has been marked as ${statusLabel}.

Type: ${feedbackTypeLabel}
Regarding: ${contentTypeLabel}

Content:
${contentPreview}

Your Feedback:
${feedbackText}

${
    adminResponse
      ? `
Response from Our Team:
${adminResponse}
`
      : ''
  }

We appreciate your help in making CISSP Mastery better for everyone!

If you have any questions, please reply to this email or contact us at support@cisspmastery.com.
  `.trim();
}
