import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin';
import { db } from '@/lib/db';
import { classes } from '@/lib/db/schema';
import { desc, asc } from 'drizzle-orm';
import { handleApiError } from '@/lib/api/error-handler';
import { log } from '@/lib/logger';
import { validateRequest, validateQueryParams } from '@/lib/api/validate';
import { createClassSchema, classQuerySchema } from '@/lib/validations/class';

// GET /api/admin/classes - Get all classes
export async function GET(request: Request) {
  try {
    const admin = await requireAdmin();

    // Validate query parameters
    const queryParams = validateQueryParams(request, classQuerySchema);

    log.debug('Fetching all classes', {
      userId: admin.clerkUserId,
      endpoint: '/api/admin/classes',
      queryParams,
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

    // Validate request body
    const validatedData = await validateRequest(request, createClassSchema);

    log.info('Creating new class', {
      userId: admin.clerkUserId,
      className: validatedData.name,
    });

    const newClass = await db
      .insert(classes)
      .values({
        ...validatedData,
        description: validatedData.description || null,
        icon: validatedData.icon || null,
        color: validatedData.color || 'purple',
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
