import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';


vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  db: {
    query: {
      classes: {
        findFirst: vi.fn(),
      },
    },
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
    }),
  },
}));

const { db } = await import('@/lib/db');
const { auth } = await import('@clerk/nextjs/server');

function createRequest(method: 'GET' = 'GET') {
  return new NextRequest(new URL('http://localhost/api/progress/domain/d1'), { method });
}

function makeParams(domainId: string) {
  return { params: Promise.resolve({ domainId }) };
}

describe('/api/progress/domain/[domainId]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (auth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ userId: 'user_1' });
  });

  it('returns 401 when unauthenticated', async () => {
    (auth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ userId: null });

    // Dynamic import to restart the module if needed, though with vi.fn() it might persist correctly.
    // However, existing tests showed static import. Let's stick to cleaning up mocks.
    // Standardizing on dynamic import for consistency is safer.
    const { GET } = await import('./route');

    const res = await GET(createRequest(), makeParams('d1'));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body).toEqual({ error: 'Unauthorized' });
  });

  it('returns 404 when domain not found', async () => {
    (db.query.classes.findFirst as vi.Mock).mockResolvedValue(null);
    const { GET } = await import('./route');

    const res = await GET(createRequest(), makeParams('missing'));
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body).toEqual({ error: 'Domain not found' });
  });

  it('returns zero stats when class has no flashcards', async () => {
    (db.query.classes.findFirst as vi.Mock).mockResolvedValue({
      id: 'd1',
      decks: [],
    });
    const { GET } = await import('./route');

    const res = await GET(createRequest(), makeParams('d1'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.totalCards).toBe(0);
  });
});