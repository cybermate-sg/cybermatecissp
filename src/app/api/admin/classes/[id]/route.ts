import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin';
import { db } from '@/lib/db';
import { classes, decks, flashcards } from '@/lib/db/schema';
import { eq, count } from 'drizzle-orm';
import { handleApiError, assertExists, createApiError } from '@/lib/api/error-handler';
import { log } from '@/lib/logger';
import { validatePathParams, validatePartial } from '@/lib/api/validate';
import { classIdSchema, updateClassSchema } from '@/lib/validations/class';

// GET /api/admin/classes/:id - Get a specific class with its decks
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    const resolvedParams = await params;

    // Validate path parameters
    const { id } = validatePathParams(resolvedParams, classIdSchema);

    log.debug('Fetching class', {
      userId: admin.clerkUserId,
      classId: id,
    });

    const classData = await db
      .select()
      .from(classes)
      .where(eq(classes.id, id))
      .limit(1);

    assertExists(classData[0], 'Class not found', 404);

    // Get all decks in this class
    const classDecks = await db
      .select()
      .from(decks)
      .where(eq(decks.classId, id));

    // Get flashcard count for each deck
    const decksWithCount = await Promise.all(
      classDecks.map(async (deck) => {
        const [countResult] = await db
          .select({ count: count() })
          .from(flashcards)
          .where(eq(flashcards.deckId, deck.id));

        return {
          ...deck,
          cardCount: countResult.count,
        };
      })
    );

    log.info('Class fetched successfully', {
      userId: admin.clerkUserId,
      classId: id,
      deckCount: decksWithCount.length,
    });

    return NextResponse.json({
      class: classData[0],
      decks: decksWithCount,
    });
  } catch (error) {
    return handleApiError(error, 'fetch class', {
      endpoint: '/api/admin/classes/[id]',
      method: 'GET',
    });
  }
}

// PUT /api/admin/classes/:id - Update a class
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    const resolvedParams = await params;

    // Validate path parameters
    const { id } = validatePathParams(resolvedParams, classIdSchema);

    // Validate request body (partial update)
    const validatedData = await validatePartial(request, updateClassSchema);

    // Ensure at least one field is being updated
    if (Object.keys(validatedData).length === 0) {
      throw createApiError('No valid fields provided for update', 400, 'NO_UPDATE_FIELDS');
    }

    log.info('Updating class', {
      userId: admin.clerkUserId,
      classId: id,
      fields: Object.keys(validatedData),
    });

    const updatedClass = await db
      .update(classes)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(eq(classes.id, id))
      .returning();

    assertExists(updatedClass[0], 'Class not found', 404);

    log.info('Class updated successfully', {
      userId: admin.clerkUserId,
      classId: id,
      className: updatedClass[0].name,
    });

    return NextResponse.json({
      class: updatedClass[0],
      message: 'Class updated successfully',
    });
  } catch (error) {
    return handleApiError(error, 'update class', {
      endpoint: '/api/admin/classes/[id]',
      method: 'PUT',
    });
  }
}

// DELETE /api/admin/classes/:id - Delete a class
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    const resolvedParams = await params;

    // Validate path parameters
    const { id } = validatePathParams(resolvedParams, classIdSchema);

    log.warn('Deleting class', {
      userId: admin.clerkUserId,
      classId: id,
    });

    // Check if class exists
    const classData = await db
      .select()
      .from(classes)
      .where(eq(classes.id, id))
      .limit(1);

    assertExists(classData[0], 'Class not found', 404);

    // Delete class (cascades to decks and flashcards)
    await db.delete(classes).where(eq(classes.id, id));

    log.info('Class deleted successfully', {
      userId: admin.clerkUserId,
      classId: id,
      className: classData[0].name,
    });

    return NextResponse.json({
      message: 'Class deleted successfully',
    });
  } catch (error) {
    return handleApiError(error, 'delete class', {
      endpoint: '/api/admin/classes/[id]',
      method: 'DELETE',
    });
  }
}
