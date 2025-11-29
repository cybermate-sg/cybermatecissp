import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { flashcardMedia } from '@/lib/db/schema';
import { list } from '@vercel/blob';
import { findOrphanedImages, deleteMultipleImagesFromBlob } from '@/lib/blob';
import { requireAdmin } from '@/lib/auth/admin';
import { withErrorHandling } from '@/lib/api/error-handler';
import { withTracing } from '@/lib/middleware/with-tracing';

/**
 * GET /api/admin/cleanup
 * Find orphaned images in blob storage
 */
async function getCleanupReport(_request: NextRequest) {
  void _request;
  try {
    await requireAdmin();

    // Get all file URLs from database
    const dbMedia = await db.select({ fileUrl: flashcardMedia.fileUrl }).from(flashcardMedia);
    const dbFileUrls = dbMedia.map((m) => m.fileUrl);

    // Get all files from blob storage
    const { blobs } = await list({
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    const blobFileUrls = blobs.map((blob) => blob.url);

    // Find orphaned images
    const orphanedImages = findOrphanedImages(dbFileUrls, blobFileUrls);

    return NextResponse.json({
      success: true,
      orphanedCount: orphanedImages.length,
      orphanedImages,
      totalBlobFiles: blobFileUrls.length,
      totalDbFiles: dbFileUrls.length,
    });
  } catch (error) {
    console.error('Error finding orphaned images:', error);
    throw error;
  }
}

export const GET = withTracing(
  withErrorHandling(getCleanupReport, 'admin cleanup report'),
  { logRequest: true, logResponse: false }
);

/**
 * DELETE /api/admin/cleanup
 * Delete orphaned images from blob storage
 */
async function deleteCleanupOrphans(request: NextRequest) {
  try {
    await requireAdmin();

    const { orphanedImages } = await request.json();

    if (!orphanedImages || !Array.isArray(orphanedImages)) {
      return NextResponse.json(
        { success: false, error: 'Invalid request: orphanedImages array required' },
        { status: 400 }
      );
    }

    if (orphanedImages.length === 0) {
      return NextResponse.json({
        success: true,
        deletedCount: 0,
        message: 'No orphaned images to delete',
      });
    }

    // Delete orphaned images from blob storage
    await deleteMultipleImagesFromBlob(orphanedImages);

    return NextResponse.json({
      success: true,
      deletedCount: orphanedImages.length,
      message: `Successfully deleted ${orphanedImages.length} orphaned image(s)`,
    });
  } catch (error) {
    console.error('Error deleting orphaned images:', error);
    throw error;
  }
}

export const DELETE = withTracing(
  withErrorHandling(deleteCleanupOrphans, 'admin cleanup delete orphans'),
  { logRequest: true, logResponse: false }
);
