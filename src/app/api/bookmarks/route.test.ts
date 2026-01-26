import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

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
    query: {
      bookmarkedFlashcards: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
      },
      flashcards: {
        findFirst: vi.fn(),
      },
    },
    insert: vi.fn().mockReturnValue({ values: vi.fn().mockReturnThis(), returning: vi.fn().mockResolvedValue([]) }),
  },
}));

vi.mock('@/lib/redis/cache-keys', () => ({
  CacheKeys: {
    bookmarks: {
      userList: (userId: string) => `bookmarks:list:${userId}`,
      userAll: (userId: string) => `bookmarks:*:${userId}`,
    },
  },
  CacheTTL: {
    BOOKMARKS: 3600,
  },
}));

const { db } = await import('@/lib/db');
const { cache } = await import('@/lib/redis');
const { auth } = await import('@clerk/nextjs/server');

function createRequest(body?: unknown, method: 'GET' | 'POST' = 'POST') {
  const url = 'http://localhost:3000/api/bookmarks';
  const init: RequestInit = {
    method,
    headers: {
      'content-type': 'application/json',
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  };
  return new NextRequest(new URL(url), init);
}

describe('/api/bookmarks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (auth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ userId: 'user_1' });
  });

  describe('GET', () => {
    it('returns 401 when user is not authenticated', async () => {
      (auth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ userId: null });
      const { GET } = await import('./route');

      const res = await GET(createRequest(undefined, 'GET'));
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body).toEqual({ error: 'Unauthorized' });
    });

    it('returns cached bookmarks when cache HIT', async () => {
      (cache.get as vi.Mock).mockResolvedValue([
        { id: 'b1', flashcardId: 'f1' },
      ]);
      const { GET } = await import('./route');

      const res = await GET(createRequest(undefined, 'GET'));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.total).toBe(1);
      expect(res.headers.get('X-Cache')).toBe('HIT');
    });

    it('fetches from DB and caches when cache MISS', async () => {
      (cache.get as vi.Mock).mockResolvedValue(null);
      (db.query.bookmarkedFlashcards.findMany as vi.Mock).mockResolvedValue([
        {
          id: 'b1',
          flashcardId: 'f1',
          createdAt: new Date('2024-01-01T00:00:00Z'),
          flashcard: {
            question: 'Q1',
            answer: 'A1',
            deckId: 'd1',
            deck: {
              name: 'Deck',
              classId: 'c1',
              class: { name: 'Class' },
            },
            media: [],
          },
        },
      ]);
      const { GET } = await import('./route');

      const res = await GET(createRequest(undefined, 'GET'));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.total).toBe(1);
      expect(res.headers.get('X-Cache')).toBe('MISS');
      expect(cache.set).toHaveBeenCalled();
    });
  });

  describe('POST', () => {
    it('returns 401 when user is not authenticated', async () => {
      (auth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ userId: null });
      const { POST } = await import('./route');

      const req = createRequest({ flashcardId: 'f1' }, 'POST');
      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body).toEqual({ error: 'Unauthorized' });
    });

    it('returns 400 when flashcardId is missing', async () => {
      const { POST } = await import('./route');
      const req = createRequest({}, 'POST');
      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body).toEqual({ error: 'flashcardId is required' });
    });

    it('returns 404 when flashcard does not exist', async () => {
      (db.query.flashcards.findFirst as vi.Mock).mockResolvedValue(null);
      const { POST } = await import('./route');

      const req = createRequest({ flashcardId: 'missing' }, 'POST');
      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(404);
      expect(body).toEqual({ error: 'Flashcard not found' });
    });

    it('returns success when bookmark already exists', async () => {
      (db.query.flashcards.findFirst as vi.Mock).mockResolvedValue({ id: 'f1' });
      (db.query.bookmarkedFlashcards.findFirst as vi.Mock).mockResolvedValue({ id: 'b1' });
      const { POST } = await import('./route');

      const req = createRequest({ flashcardId: 'f1' }, 'POST');
      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body).toEqual({
        success: true,
        bookmarked: true,
        message: 'Already bookmarked',
      });
    });

    it('creates a bookmark and invalidates cache', async () => {
      (db.query.flashcards.findFirst as vi.Mock).mockResolvedValue({ id: 'f1' });
      (db.query.bookmarkedFlashcards.findFirst as vi.Mock).mockResolvedValue(null);
      const { POST } = await import('./route');

      const req = createRequest({ flashcardId: 'f1' }, 'POST');
      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(201);
      expect(body.success).toBe(true);
      expect(cache.del).toHaveBeenCalled();
    });
  });
});