import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { aiModelConfigurations } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';

/**
 * GET /api/admin/ai-models
 * List all AI model configurations
 */
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.clerkUserId, userId),
    });

    if (user?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    // Fetch all models ordered by priority
    const models = await db
      .select()
      .from(aiModelConfigurations)
      .orderBy(aiModelConfigurations.priority, desc(aiModelConfigurations.successCount));

    return NextResponse.json({
      models,
      total: models.length,
      enabled: models.filter(m => m.enabled).length,
    });
  } catch (error) {
    console.error('[AI Models API] Error fetching models:', error);
    return NextResponse.json(
      { error: 'Failed to fetch AI models' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/ai-models
 * Create a new AI model configuration
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.clerkUserId, userId),
    });

    if (user?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const body = await request.json();

    // Validate required fields
    if (!body.modelId || !body.name) {
      return NextResponse.json(
        { error: 'modelId and name are required' },
        { status: 400 }
      );
    }

    // Check if model already exists
    const existing = await db.query.aiModelConfigurations.findFirst({
      where: (models, { eq }) => eq(models.modelId, body.modelId),
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Model with this ID already exists' },
        { status: 409 }
      );
    }

    // Create new model
    const newModel = await db
      .insert(aiModelConfigurations)
      .values({
        modelId: body.modelId,
        name: body.name,
        provider: body.provider || null,
        priority: body.priority || 100,
        enabled: body.enabled !== undefined ? body.enabled : true,
        timeoutMs: body.timeoutMs || null,
        temperature: body.temperature ? String(body.temperature) : null,
        maxTokens: body.maxTokens || null,
        costPer1kTokens: body.costPer1kTokens ? String(body.costPer1kTokens) : null,
        isFree: body.isFree !== undefined ? body.isFree : true,
        description: body.description || null,
        createdBy: userId,
      })
      .returning();

    console.log('[AI Models API] Created new model:', newModel[0].modelId);

    return NextResponse.json({
      model: newModel[0],
      message: 'Model created successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('[AI Models API] Error creating model:', error);
    return NextResponse.json(
      { error: 'Failed to create AI model' },
      { status: 500 }
    );
  }
}
