import { NextRequest, NextResponse } from 'next/server';

export function createJsonRequest(url: string, options: { method?: string; body?: unknown; headers?: Record<string, string> } = {}): NextRequest {
  const { method = 'GET', body, headers = {} } = options;

  const init: RequestInit = {
    method,
    headers: {
      'content-type': 'application/json',
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  };

  // NextRequest constructor signature under Next 15 supports (input, init)
  // We cast here to keep things simple in tests.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new (NextRequest as any)(new Request(url, init));
}

export async function parseJsonResponse(response: NextResponse) {
  const text = await response.text();
  try {
    return {
      status: response.status,
      json: text ? JSON.parse(text) : null,
    };
  } catch {
    return {
      status: response.status,
      json: text,
    };
  }
}

// Simple helpers to mock Clerk auth in route modules
export type MockAuthUser = {
  userId: string | null;
};

export function mockClerkAuth(mock: MockAuthUser) {
  vi.mock('@clerk/nextjs/server', () => ({
    auth: async () => ({ userId: mock.userId }),
  }));
}