import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { aiModelConfigurations } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * GET /api/admin/ai-models/:id
 * Get a specific AI model configuration
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.clerkUserId, userId),
    });

    if (user?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;

    const model = await db.query.aiModelConfigurations.findFirst({
      where: (models, { eq }) => eq(models.id, id),
    });

    if (!model) {
      return NextResponse.json({ error: 'Model not found' }, { status: 404 });
    }

    return NextResponse.json({ model });
  } catch (error) {
    console.error('[AI Models API] Error fetching model:', error);
    return NextResponse.json(
      { error: 'Failed to fetch AI model' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/ai-models/:id
 * Update an AI model configuration
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.clerkUserId, userId),
    });

    if (user?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const body = (await request.json()) as Partial<
      typeof aiModelConfigurations.$inferInsert
    >;

    // Check if model exists
    const existing = await db.query.aiModelConfigurations.findFirst({
      where: (models, { eq }) => eq(models.id, id),
    });

    if (!existing) {
      return NextResponse.json({ error: 'Model not found' }, { status: 404 });
    }

    // Build update object
    const updateData: Partial<typeof aiModelConfigurations.$inferInsert> & { updatedAt: Date } = {
      updatedAt: new Date(),
    };

    if (body.name !== undefined) updateData.name = body.name;
    if (body.provider !== undefined) updateData.provider = body.provider;
    if (body.priority !== undefined) updateData.priority = body.priority;
    if (body.enabled !== undefined) updateData.enabled = body.enabled;
    if (body.timeoutMs !== undefined) updateData.timeoutMs = body.timeoutMs;
    if (body.temperature !== undefined) updateData.temperature = String(body.temperature);
    if (body.maxTokens !== undefined) updateData.maxTokens = body.maxTokens;
    if (body.costPer1kTokens !== undefined) updateData.costPer1kTokens = String(body.costPer1kTokens);
    if (body.isFree !== undefined) updateData.isFree = body.isFree;
    if (body.description !== undefined) updateData.description = body.description;

    // Update model
    const updated = await db
      .update(aiModelConfigurations)
      .set(updateData)
      .where(eq(aiModelConfigurations.id, id))
      .returning();

    console.log('[AI Models API] Updated model:', updated[0].modelId);

    return NextResponse.json({
      model: updated[0],
      message: 'Model updated successfully'
    });
  } catch (error) {
    console.error('[AI Models API] Error updating model:', error);
    return NextResponse.json(
      { error: 'Failed to update AI model' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/ai-models/:id
 * Delete an AI model configuration
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.clerkUserId, userId),
    });

    if (user?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;

    // Check if model exists
    const existing = await db.query.aiModelConfigurations.findFirst({
      where: (models, { eq }) => eq(models.id, id),
    });

    if (!existing) {
      return NextResponse.json({ error: 'Model not found' }, { status: 404 });
    }

    // Delete model
    await db
      .delete(aiModelConfigurations)
      .where(eq(aiModelConfigurations.id, id));

    console.log('[AI Models API] Deleted model:', existing.modelId);

    return NextResponse.json({
      message: 'Model deleted successfully'
    });
  } catch (error) {
    console.error('[AI Models API] Error deleting model:', error);
    return NextResponse.json(
      { error: 'Failed to delete AI model' },
      { status: 500 }
    );
  }
}
