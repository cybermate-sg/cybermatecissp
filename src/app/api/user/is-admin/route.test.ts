import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';

vi.mock('@/lib/auth/admin', () => ({
  checkIsAdmin: vi.fn(),
}));

const { checkIsAdmin } = await import('@/lib/auth/admin');

describe('GET /api/user/is-admin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns isAdmin: true when checkIsAdmin returns a user', async () => {
    (checkIsAdmin as vi.Mock).mockResolvedValue({ id: 'user_1' });

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ isAdmin: true });
  });

  it('returns isAdmin: false when checkIsAdmin returns null', async () => {
    (checkIsAdmin as vi.Mock).mockResolvedValue(null);

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ isAdmin: false });
  });

  it('returns isAdmin: false when checkIsAdmin throws', async () => {
    (checkIsAdmin as vi.Mock).mockRejectedValue(new Error('boom'));

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ isAdmin: false });
  });
});