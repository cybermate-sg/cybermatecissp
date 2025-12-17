/**
 * Email template for admin feedback notification
 * Plain HTML template (can be upgraded to React Email later)
 */

interface AdminFeedbackNotificationProps {
  feedbackId: string;
  userName: string;
  userEmail: string;
  feedbackType: string;
  feedbackText: string;
  contentType: 'flashcard' | 'flashcard_quiz' | 'deck_quiz';
  contentPreview: string;
  dashboardUrl: string;
  screenshotUrl?: string;
}

export function getAdminFeedbackNotificationHtml(
  props: AdminFeedbackNotificationProps
): string {
  const {
    feedbackId,
    userName,
    userEmail,
    feedbackType,
    feedbackText,
    contentType,
    contentPreview,
    dashboardUrl,
    screenshotUrl,
  } = props;

  const contentTypeLabel =
    contentType === 'flashcard'
      ? 'Flashcard'
      : contentType === 'flashcard_quiz'
      ? 'Flashcard Quiz Question'
      : 'Deck Quiz Question';

  const feedbackTypeLabel = feedbackType
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  const badgeClass =
    feedbackType === 'content_error'
      ? 'badge-error'
      : feedbackType === 'typo'
      ? 'badge-typo'
      : feedbackType === 'unclear_explanation'
      ? 'badge-unclear'
      : feedbackType === 'technical_issue'
      ? 'badge-technical'
      : 'badge-suggestion';

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
            color: #7c3aed;
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
          }
          .badge-error {
            background-color: #fee2e2;
            color: #991b1b;
          }
          .badge-typo {
            background-color: #fef3c7;
            color: #92400e;
          }
          .badge-unclear {
            background-color: #dbeafe;
            color: #1e40af;
          }
          .badge-technical {
            background-color: #f3e8ff;
            color: #6b21a8;
          }
          .badge-suggestion {
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
            border-left: 4px solid #7c3aed;
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
          .screenshot {
            margin: 20px 0;
          }
          .screenshot img {
            max-width: 100%;
            height: auto;
            border-radius: 4px;
            border: 1px solid #e5e7eb;
          }
          .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #7c3aed;
            color: #ffffff;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            margin: 20px 0;
          }
          .button:hover {
            background-color: #6d28d9;
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
          <h1>🔔 New User Feedback</h1>

          <span class="badge ${badgeClass}">${feedbackTypeLabel}</span>

          <div class="info-row">
            <div class="info-label">From User</div>
            <div class="info-value">
              ${userName || 'Anonymous'} (${userEmail})
            </div>
          </div>

          <div class="info-row">
            <div class="info-label">Regarding</div>
            <div class="info-value">${contentTypeLabel}</div>
          </div>

          <div class="info-row">
            <div class="info-label">Content Preview</div>
            <div class="content-preview">${contentPreview}</div>
          </div>

          <div class="feedback-text">
            <div class="info-label" style="margin-bottom: 8px;">Feedback</div>
            ${feedbackText}
          </div>

          ${
            screenshotUrl
              ? `
            <div class="screenshot">
              <div class="info-label" style="margin-bottom: 8px;">Screenshot</div>
              <a href="${screenshotUrl}" target="_blank">
                <img src="${screenshotUrl}" alt="User screenshot" />
              </a>
            </div>
          `
              : ''
          }

          <a href="${dashboardUrl}" class="button">
            View in Admin Dashboard →
          </a>

          <div class="footer">
            <p>
              Feedback ID: ${feedbackId}<br>
              This is an automated notification from CISSP Mastery.
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
export function getAdminFeedbackNotificationText(
  props: AdminFeedbackNotificationProps
): string {
  const {
    feedbackId,
    userName,
    userEmail,
    feedbackType,
    feedbackText,
    contentType,
    contentPreview,
    dashboardUrl,
  } = props;

  const contentTypeLabel =
    contentType === 'flashcard'
      ? 'Flashcard'
      : contentType === 'flashcard_quiz'
      ? 'Flashcard Quiz Question'
      : 'Deck Quiz Question';

  const feedbackTypeLabel = feedbackType
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return `
New User Feedback Received

Type: ${feedbackTypeLabel}
From: ${userName || 'Anonymous'} (${userEmail})
Regarding: ${contentTypeLabel}

Content Preview:
${contentPreview}

Feedback:
${feedbackText}

View in Admin Dashboard:
${dashboardUrl}

Feedback ID: ${feedbackId}
  `.trim();
}
