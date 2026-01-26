import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Set dummy connection string to prevent db/index.ts from throwing
process.env.DATABASE_URL = 'postgresql://dummy:dummy@localhost:5432/dummy';

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/redis', () => ({
  cache: {
    get: vi.fn(),
    set: vi.fn().mockResolvedValue(undefined),
    del: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('@/lib/db', () => ({
  db: {
    delete: vi.fn().mockReturnValue({ where: vi.fn().mockReturnThis(), returning: vi.fn().mockResolvedValue([{ id: 'b1' }]) }),
    query: {
      bookmarkedFlashcards: {
        findFirst: vi.fn(),
      },
    },
  },
}));

vi.mock('@/lib/redis/cache-keys', () => ({
  CacheKeys: {
    bookmarks: {
      userAll: (userId: string) => `bookmarks:*:${userId}`,
      check: (userId: string, flashcardId: string) => `bookmark:${userId}:${flashcardId}`,
    },
  },
}));

const { db } = await import('@/lib/db');
const { cache } = await import('@/lib/redis');
const { auth } = await import('@clerk/nextjs/server');

function makeParams(flashcardId: string | null) {
  return { params: Promise.resolve({ flashcardId: flashcardId as string }) };
}

function makeRequest(method: 'GET' | 'DELETE' = 'GET') {
  return new NextRequest(new URL('http://localhost:3000/api/bookmarks/123'), { method });
}

describe('/api/bookmarks/[flashcardId]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (auth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ userId: 'user_1' });
  });

  describe('DELETE', () => {
    it('returns 401 when unauthenticated', async () => {
      (auth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ userId: null });
      const { DELETE } = await import('./route');

      const res = await DELETE(makeRequest('DELETE'), makeParams('f1'));
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body).toEqual({ error: 'Unauthorized' });
    });

    it('returns 400 when flashcardId is missing', async () => {
      const { DELETE } = await import('./route');
      const res = await DELETE(makeRequest('DELETE'), makeParams(null));
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body).toEqual({ error: 'flashcardId is required' });
    });

    it('returns 404 when bookmark not found', async () => {
      (db.delete as vi.Mock).mockReturnValueOnce({
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([]),
      });
      const { DELETE } = await import('./route');

      const res = await DELETE(makeRequest('DELETE'), makeParams('f1'));
      const body = await res.json();

      expect(res.status).toBe(404);
      expect(body).toEqual({
        success: false,
        message: 'Bookmark not found',
      });
    });

    it('deletes bookmark and invalidates cache', async () => {
      const { DELETE } = await import('./route');
      const res = await DELETE(makeRequest('DELETE'), makeParams('f1'));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(cache.del).toHaveBeenCalled();
    });
  });

  describe('GET', () => {
    it('returns 401 when unauthenticated', async () => {
      (auth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ userId: null });
      const { GET } = await import('./route');

      const res = await GET(makeRequest('GET'), makeParams('f1'));
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body).toEqual({ error: 'Unauthorized' });
    });

    it('returns cached result when available', async () => {
      (cache.get as vi.Mock).mockResolvedValue(true);
      const { GET } = await import('./route');

      const res = await GET(makeRequest('GET'), makeParams('f1'));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body).toEqual({ bookmarked: true });
    });

    it('queries DB and caches when no cache entry', async () => {
      (cache.get as vi.Mock).mockResolvedValue(null);
      (db.query.bookmarkedFlashcards.findFirst as vi.Mock).mockResolvedValue({ id: 'b1' });
      const { GET } = await import('./route');

      const res = await GET(makeRequest('GET'), makeParams('f1'));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body).toEqual({ bookmarked: true });
      expect(cache.set).toHaveBeenCalled();
    });
  });
});