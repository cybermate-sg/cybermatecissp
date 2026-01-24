import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';


vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  db: {
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([
        { id: 'session_1', startedAt: new Date('2024-01-01T00:00:00Z') },
      ]),
    }),
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
  return new NextRequest(new URL('http://localhost/api/sessions/create'), init);
}

describe('/api/sessions/create', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (auth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ userId: 'user_1' });
  });

  it('returns 401 when unauthenticated', async () => {
    (auth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ userId: null });
    const { POST } = await import('./route');

    const req = createRequest({ deckIds: ['d1'] });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body).toEqual({ error: 'Unauthorized' });
  });

  it('returns 400 when deckIds is missing or empty', async () => {
    const { POST } = await import('./route');
    const req = createRequest({ deckIds: [] });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body).toEqual({ error: 'At least one deck must be selected' });
  });

  it('creates a study session and returns session data', async () => {
    const { POST } = await import('./route');
    const req = createRequest({ deckIds: ['d1'] });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.sessionId).toBe('session_1');
  });
});