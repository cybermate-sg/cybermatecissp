import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';


vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([
        { id: 'session_1', startedAt: new Date('2024-01-01T00:00:00Z') },
      ]),
    }),
    update: vi.fn().mockReturnValue({ set: vi.fn().mockReturnThis(), where: vi.fn().mockReturnThis() }),
    insert: vi.fn().mockReturnValue({ values: vi.fn().mockReturnThis() }),
  },
}));


const { auth } = await import('@clerk/nextjs/server');

function createRequest(body?: unknown) {
  const init: RequestInit = {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  };
  return new NextRequest(new URL('http://localhost/api/sessions/end'), init);
}

describe('/api/sessions/end', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (auth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ userId: 'user_1' });
  });

  it('returns 401 when unauthenticated', async () => {
    (auth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ userId: null });
    const { POST } = await import('./route');

    const req = createRequest({ sessionId: 'session_1', cardsStudied: 10 });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body).toEqual({ error: 'Unauthorized' });
  });

  it('returns 400 when sessionId is missing', async () => {
    const { POST } = await import('./route');
    const req = createRequest({ cardsStudied: 10 });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body).toEqual({ error: 'Session ID is required' });
  });

  it('returns 404 when session is not found', async () => {
    const { db } = await import('@/lib/db');
    (db.select as vi.Mock).mockReturnValueOnce({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([]),
    });
    const { POST } = await import('./route');

    const req = createRequest({ sessionId: 'missing', cardsStudied: 10 });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body).toEqual({ error: 'Session not found' });
  });

  it('ends session and returns success payload', async () => {
    const { POST } = await import('./route');
    const req = createRequest({ sessionId: 'session_1', cardsStudied: 10 });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.session.id).toBe('session_1');
  });
});