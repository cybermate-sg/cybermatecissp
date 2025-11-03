import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin';
import { db } from '@/lib/db';
import { classes } from '@/lib/db/schema';
import { desc, asc } from 'drizzle-orm';
import { handleApiError, assertExists } from '@/lib/api/error-handler';
import { log } from '@/lib/logger';

// GET /api/admin/classes - Get all classes
export async function GET() {
  try {
    const admin = await requireAdmin();

    log.debug('Fetching all classes', {
      userId: admin.clerkUserId,
      endpoint: '/api/admin/classes'
    });

    const allClasses = await db
      .select()
      .from(classes)
      .orderBy(asc(classes.order), desc(classes.createdAt));

    log.info('Classes fetched successfully', {
      userId: admin.clerkUserId,
      count: allClasses.length,
    });

    return NextResponse.json({
      classes: allClasses,
      total: allClasses.length,
    });
  } catch (error) {
    return handleApiError(error, 'fetch classes', {
      endpoint: '/api/admin/classes',
      method: 'GET',
    });
  }
}

// POST /api/admin/classes - Create a new class
export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();

    const { name, description, order, icon, color, isPublished } = body;

    // Validation
    assertExists(name, 'Class name is required', 400);

    log.info('Creating new class', {
      userId: admin.clerkUserId,
      className: name,
    });

    const newClass = await db
      .insert(classes)
      .values({
        name,
        description: description || null,
        order: order || 0,
        icon: icon || null,
        color: color || 'purple',
        isPublished: isPublished !== undefined ? isPublished : true,
        createdBy: admin.clerkUserId,
      })
      .returning();

    log.info('Class created successfully', {
      userId: admin.clerkUserId,
      classId: newClass[0].id,
      className: newClass[0].name,
    });

    return NextResponse.json({
      class: newClass[0],
      message: 'Class created successfully',
    });
  } catch (error) {
    return handleApiError(error, 'create class', {
      endpoint: '/api/admin/classes',
      method: 'POST',
    });
  }
}
