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

/**
 * GET /api/admin/topics/lookup
 * Lookup a sub-topic by topic_code and sub_topic_name
 * Used during quiz upload to resolve sub_topic_id
 */
async function lookupSubTopic(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const topicCode = searchParams.get('topic_code');
    const subTopicName = searchParams.get('sub_topic_name');

    if (!topicCode || !subTopicName) {
      return NextResponse.json(
        { error: 'Both topic_code and sub_topic_name are required' },
        { status: 400 }
      );
    }

    // Find the topic by code
    const topic = await db.query.topics.findFirst({
      where: eq(topics.topicCode, topicCode),
    });

    if (!topic) {
      return NextResponse.json(
        { error: `Topic not found for code: ${topicCode}` },
        { status: 404 }
      );
    }

    // Find the sub-topic by name within this topic
    const subTopic = await db.query.subTopics.findFirst({
      where: eq(subTopics.topicId, topic.id),
    });

    // Try to find exact match or partial match
    const allSubTopics = await db.query.subTopics.findMany({
      where: eq(subTopics.topicId, topic.id),
    });

    const matchedSubTopic = allSubTopics.find(
      (st) => st.subTopicName.toLowerCase() === subTopicName.toLowerCase()
    ) || allSubTopics.find(
      (st) => st.subTopicName.toLowerCase().includes(subTopicName.toLowerCase()) ||
              subTopicName.toLowerCase().includes(st.subTopicName.toLowerCase())
    );

    if (!matchedSubTopic) {
      return NextResponse.json({
        success: false,
        error: `Sub-topic not found: ${subTopicName} under topic ${topicCode}`,
        availableSubTopics: allSubTopics.map((st) => st.subTopicName),
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        topicId: topic.id,
        topicCode: topic.topicCode,
        topicName: topic.topicName,
        subTopicId: matchedSubTopic.id,
        subTopicName: matchedSubTopic.subTopicName,
      },
    });
  } catch (error) {
    console.error('Error looking up sub-topic:', error);
    throw error;
  }
}
