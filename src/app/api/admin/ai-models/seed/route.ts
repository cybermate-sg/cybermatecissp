import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { aiModelConfigurations } from '@/lib/db/schema';

/**
 * POST /api/admin/ai-models/seed
 * One-time seeder for initial AI models
 */
export async function POST() {
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

    const defaultModels = [
      {
        modelId: 'meta-llama/llama-3.2-3b-instruct:free',
        name: 'Llama 3.2 3B',
        provider: 'meta-llama',
        priority: 1,
        enabled: true,
        timeoutMs: 45000,
        temperature: '0.70',
        isFree: true,
        description: 'Fast, lightweight model - good for simple questions',
        createdBy: userId,
      },
      {
        modelId: 'mistralai/mistral-7b-instruct:free',
        name: 'Mistral 7B',
        provider: 'mistralai',
        priority: 2,
        enabled: true,
        timeoutMs: 60000,
        temperature: '0.70',
        isFree: true,
        description: 'Balanced performance and quality',
        createdBy: userId,
      },
      {
        modelId: 'google/gemini-2.0-flash-exp:free',
        name: 'Gemini 2.0 Flash',
        provider: 'google',
        priority: 3,
        enabled: true,
        timeoutMs: 45000,
        temperature: '0.70',
        isFree: true,
        description: 'Google experimental model',
        createdBy: userId,
      },
      {
        modelId: 'qwen/qwen-2-7b-instruct:free',
        name: 'Qwen 2 7B',
        provider: 'qwen',
        priority: 4,
        enabled: true,
        timeoutMs: 60000,
        temperature: '0.70',
        isFree: true,
        description: 'Alibaba instruction-tuned model',
        createdBy: userId,
      },
    ];

    const inserted = await db
      .insert(aiModelConfigurations)
      .values(defaultModels)
      .onConflictDoNothing()
      .returning();

    console.log(`[AI Models Seed] Seeded ${inserted.length} AI models`);

    return NextResponse.json({
      message: `Successfully seeded ${inserted.length} AI models`,
      models: inserted,
      skipped: defaultModels.length - inserted.length,
    });
  } catch (error) {
    console.error('[AI Models Seed] Error seeding models:', error);
    return NextResponse.json(
      { error: 'Failed to seed AI models' },
      { status: 500 }
    );
  }
}
