import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin';
import { db } from '@/lib/db';
import { topics, subTopics } from '@/lib/db/schema';
import { eq, asc } from 'drizzle-orm';
import { withErrorHandling } from '@/lib/api/error-handler';
import { withTracing } from '@/lib/middleware/with-tracing';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/topics
 * Fetch all topics with their sub-topics, optionally filtered by domain
 * Admin only
 */
async function getTopics(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const domainNumber = searchParams.get('domain');

    // Build query conditions
    const whereClause = domainNumber ? eq(topics.domainNumber, parseInt(domainNumber)) : undefined;

    // Fetch topics with sub-topics
    const topicsData = await db.query.topics.findMany({
      where: whereClause,
      orderBy: [asc(topics.domainNumber), asc(topics.order)],
      with: {
        subTopics: {
          orderBy: [asc(subTopics.order)],
        },
      },
    });

    // Transform data for frontend
    const result = topicsData.map((topic) => ({
      id: topic.id,
      domainNumber: topic.domainNumber,
      topicCode: topic.topicCode,
      topicName: topic.topicName,
      order: topic.order,
      subTopics: topic.subTopics.map((st) => ({
        id: st.id,
        subTopicName: st.subTopicName,
        order: st.order,
      })),
    }));

    return NextResponse.json({
      success: true,
      data: result,
      count: result.length,
    });
  } catch (error) {
    console.error('Error fetching topics:', error);
    throw error;
  }
}

export const GET = withTracing(
  withErrorHandling(getTopics as (req: NextRequest, ...args: unknown[]) => Promise<NextResponse>, 'get admin topics'),
  { logRequest: false, logResponse: false }
) as typeof getTopics;


