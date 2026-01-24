import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';


vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  db: {
    query: {
      subscriptions: {
        findFirst: vi.fn(),
      },
    },
  },
}));

vi.mock('@/lib/subscription', () => ({
  isSubscriptionExpired: () => false,
  calculateDaysRemaining: () => 30,
  ACCESS_DURATION_DAYS: 365,
}));

const { db } = await import('@/lib/db');
const { auth } = await import('@clerk/nextjs/server');

function createRequest() {
  return new NextRequest(new URL('http://localhost/api/subscription/status'));
}

describe('/api/subscription/status', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (auth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ userId: 'user_1' });
  });

  it('returns 401 when unauthenticated', async () => {
    (auth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ userId: null });
    const { GET } = await import('./route');

    const res = await GET(createRequest());
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body).toEqual({ error: 'Unauthorized' });
  });

  it('returns free plan when no subscription exists', async () => {
    (db.query.subscriptions.findFirst as vi.Mock).mockResolvedValue(null);
    const { GET } = await import('./route');

    const res = await GET(createRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.planType).toBe('free');
    expect(body.hasPaidAccess).toBe(false);
  });

  it('returns paid plan when active subscription exists', async () => {
    (db.query.subscriptions.findFirst as vi.Mock).mockResolvedValue({
      planType: 'pro_monthly',
      status: 'active',
      createdAt: new Date('2024-01-01T00:00:00Z'),
    });
    const { GET } = await import('./route');

    const res = await GET(createRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.hasPaidAccess).toBe(true);
    expect(body.status).toBe('active');
  });
});