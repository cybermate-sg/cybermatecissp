import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { POST, GET } from './route';

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/db/ensure-user', () => ({
  ensureUserExists: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/db', () => ({
  db: {
    query: {
      flashcards: {
        findFirst: vi.fn(),
      },
      userCardProgress: {
        findFirst: vi.fn(),
      },
    },
    insert: vi.fn().mockReturnValue({ values: vi.fn().mockReturnThis(), returning: vi.fn().mockResolvedValue([{ id: 'p1' }]) }),
    update: vi.fn().mockReturnValue({ set: vi.fn().mockReturnThis(), where: vi.fn().mockReturnThis(), returning: vi.fn().mockResolvedValue([{ id: 'p1' }]) }),
  },
}));

vi.mock('@/lib/redis/invalidation', () => ({
  CacheInvalidation: {
    userProgress: (_userId: string, _flashcardId: string, _classId: string) => ['key1'],
  },
  safeInvalidate: vi.fn().mockResolvedValue(undefined),
}));

const { db } = await import('@/lib/db');
const { auth } = await import('@clerk/nextjs/server');

function createRequest(body?: unknown, method: 'GET' | 'POST' = 'POST', params?: Record<string, string>) {
  let url = 'http://localhost/api/progress/card';
  if (params) {
    const searchParams = new URLSearchParams(params);
    url += `?${searchParams.toString()}`;
  }
  const init: RequestInit = {
    method,
    headers: {
      'content-type': 'application/json',
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  };
  return new NextRequest(new URL(url), init);
}

describe('/api/progress/card', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (auth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ userId: 'user_1' });
  });

  describe('POST', () => {
    it('returns 401 when unauthenticated', async () => {
      (auth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ userId: null });

      // Dynamic import to be safe, although we are mixing patterns.
      // Let's stick to dynamic for the route to ensure clean module state? 
      // Actually, if we use vi.fn() on the mock, static imports are fine for the mock itself, 
      // but if the route module captures env vars or does top level auth checks (unlikely), 
      // dynamic is better. Given the previous issues, lets use dynamic import for the route handler 
      // or just trust the functional mock.
      // The previous file I fixed used dynamic import of './route'. I will continue that pattern.
      const { POST } = await import('./route');

      const req = createRequest({ flashcardId: 'f1', confidenceLevel: 3 }, 'POST');
      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body).toEqual({ error: 'Unauthorized' });
    });

    it('returns 400 when required fields are missing', async () => {
      const { POST } = await import('./route');
      const req = createRequest({}, 'POST');
      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toContain('flashcardId and confidenceLevel are required');
    });

    it('returns 400 when confidenceLevel is out of range', async () => {
      const { POST } = await import('./route');
      const req = createRequest({ flashcardId: 'f1', confidenceLevel: 6 }, 'POST');
      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toContain('confidenceLevel must be between 1 and 5');
    });

    it('returns 404 when flashcard does not exist', async () => {
      (db.query.flashcards.findFirst as vi.Mock).mockResolvedValue(null);
      const { POST } = await import('./route');

      const req = createRequest({ flashcardId: 'missing', confidenceLevel: 3 }, 'POST');
      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(404);
      expect(body).toEqual({ error: 'Flashcard not found' });
    });

    it('creates new progress and returns it', async () => {
      (db.query.flashcards.findFirst as vi.Mock).mockResolvedValue({ id: 'f1', deck: { classId: 'c1' } });
      (db.query.userCardProgress.findFirst as vi.Mock).mockResolvedValue(null);
      const { POST } = await import('./route');

      const req = createRequest({ flashcardId: 'f1', confidenceLevel: 3 }, 'POST');
      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.progress).toBeDefined();
    });
  });

  describe('GET', () => {
    it('returns 401 when unauthenticated', async () => {
      (auth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ userId: null });
      const { GET } = await import('./route');

      const req = createRequest(undefined, 'GET');
      const res = await GET(req);
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body).toEqual({ error: 'Unauthorized' });
    });

    it('returns 400 when flashcardId query param is missing', async () => {
      const { GET } = await import('./route');
      const req = createRequest(undefined, 'GET');
      const res = await GET(req);
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toContain('flashcardId query parameter is required');
    });

    it('returns progress when found', async () => {
      (db.query.userCardProgress.findFirst as vi.Mock).mockResolvedValue({ id: 'p1' });
      const { GET } = await import('./route');

      const req = createRequest(undefined, 'GET', { flashcardId: 'f1' });
      const res = await GET(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.progress).toEqual({ id: 'p1' });
    });
  });
});