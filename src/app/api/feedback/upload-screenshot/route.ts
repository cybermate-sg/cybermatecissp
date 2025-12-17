import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { put } from '@vercel/blob';
import { assertAuthenticated, handleApiError } from '@/lib/api/error-handler';
import { withRateLimit } from '@/lib/middleware/with-rate-limit';
import { validateImage } from '@/lib/blob';
import { log } from '@/lib/logger';

/**
 * POST /api/feedback/upload-screenshot
 * Upload screenshot for feedback submission
 *
 * Rate limit: 20 uploads per hour per user
 *
 * Security:
 * - User must be authenticated
 * - File type validation (images only)
 * - File size validation (max 5MB)
 * - Rate limiting to prevent abuse
 *
 * Returns:
 * - url: Public URL of uploaded screenshot
 * - key: Blob storage key for deletion
 */
async function uploadScreenshot(request: NextRequest) {
  try {
    // 1. Authenticate user
    const { userId } = await auth();
    assertAuthenticated(userId);

    // 2. Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // 3. Validate image file (type and size)
    const validation = validateImage(file);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // 4. Generate unique filename
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 9);
    const fileName = `feedback-screenshot-${userId}-${timestamp}-${randomId}.${fileExtension}`;

    // 5. Upload to Vercel Blob Storage
    const blob = await put(fileName, file, {
      access: 'public',
      token: process.env.cisspm_READ_WRITE_TOKEN,
    });

    // 6. Log successful upload
    log.info('Feedback screenshot uploaded successfully', {
      userId,
      fileName,
      fileSize: file.size,
      mimeType: file.type,
      blobUrl: blob.url,
    });

    // 7. Return URL and key
    return NextResponse.json({
      success: true,
      url: blob.url,
      key: blob.pathname,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
    }, { status: 200 });

  } catch (error) {
    return handleApiError(error, 'upload feedback screenshot', {
      endpoint: '/api/feedback/upload-screenshot',
      method: 'POST',
    });
  }
}

// Apply rate limiting: 20 requests per hour per user
export const POST = withRateLimit(uploadScreenshot, {
  maxRequests: 20,
  windowMs: 60 * 60 * 1000, // 1 hour
  keyPrefix: 'feedback-screenshot',
  getUserId: async () => {
    const { userId } = await auth();
    return userId || undefined;
  },
});
