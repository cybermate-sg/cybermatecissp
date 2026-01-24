import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { POST } from './route';

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  db: {
    insert: vi.fn().mockReturnValue({ values: vi.fn().mockReturnThis() }),
  },
}));

const { db } = await import('@/lib/db');
const { auth } = await import('@clerk/nextjs/server');

function createRequest(body?: unknown) {
  const init: RequestInit = {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  };
  return new NextRequest(new URL('http://localhost/api/sessions/card'), init);
}

describe('/api/sessions/card', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (auth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ userId: 'user_1' });
  });

  it('returns 401 when unauthenticated', async () => {
    (auth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ userId: null });
    const { POST } = await import('./route');

    const req = createRequest({ sessionId: 's1', flashcardId: 'f1', confidenceRating: 3 });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body).toEqual({ error: 'Unauthorized' });
  });

  it('returns 400 when required fields are missing', async () => {
    const { POST } = await import('./route');
    const req = createRequest({});
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body).toEqual({ error: 'Missing required fields' });
  });

  it('saves session card and returns success', async () => {
    const { POST } = await import('./route');
    const req = createRequest({ sessionId: 's1', flashcardId: 'f1', confidenceRating: 3 });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ success: true });
  });
});