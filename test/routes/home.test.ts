import { beforeEach, describe, expect, it, vi } from 'vitest';
import { app } from '../../src/index';
import { getProfileCount } from '../../src/lib/profiles';
import type { Bindings } from '../../src/types';

vi.mock('../../src/lib/profiles', () => ({
  getProfileCount: vi.fn(),
}));

const getProfileCountMock = vi.mocked(getProfileCount);

function createTestEnv(overrides: Record<string, unknown> = {}): Bindings {
  return {
    DEFAULT_RATE_LIMITER: { limit: vi.fn().mockResolvedValue({ success: true }) },
    ...overrides,
  } as unknown as Bindings;
}

describe('GET /', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getProfileCountMock.mockResolvedValue(1234);
  });

  it('renders the landing page', async () => {
    const response = await app.request('/', {}, createTestEnv());

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toContain('text/html');

    const html = await response.text();

    expect(html).toContain('How long have you been on GitHub?');
    expect(html).toContain('Enter your username. Let’s find out.');
    expect(html).toContain('GitHub username');
    expect(html).toContain('Find my Gitversary');
    expect(html).toContain('1,234');
  });

  it('sets a caching header', async () => {
    const response = await app.request('/', {}, createTestEnv());

    expect(response.headers.get('Cache-Control')).toBe(
      'public, max-age=3600, stale-while-revalidate=86400',
    );
  });

  it('returns 429 when the rate limiter rejects the request', async () => {
    const env = createTestEnv({
      DEFAULT_RATE_LIMITER: { limit: vi.fn().mockResolvedValue({ success: false }) },
    });

    const response = await app.request('/', {}, env);

    expect(response.status).toBe(429);
  });
});

describe('GET /generate', () => {
  it('redirects to the profile page', async () => {
    const response = await app.request('/generate?username=octocat', {}, createTestEnv());

    expect(response.status).toBe(302);
    expect(response.headers.get('Location')).toBe('/octocat');
  });

  it('redirects to home when no username is provided', async () => {
    const response = await app.request('/generate', {}, createTestEnv());

    expect(response.status).toBe(302);
    expect(response.headers.get('Location')).toBe('/');
  });

  it('trims whitespace from the username before redirecting', async () => {
    const response = await app.request(
      '/generate?username=%20%20octocat%20%20',
      {},
      createTestEnv(),
    );

    expect(response.headers.get('Location')).toBe('/octocat');
  });
});

// Requires src/routes/home.ts's `/about` handler to define `origin` (it
// currently references it without declaring it, which throws a
// ReferenceError at runtime): add
//   const origin = new URL(c.req.url).origin;
// as the first line of the `/about` handler.
describe('GET /about', () => {
  it('renders the about page', async () => {
    const response = await app.request('/about', {}, createTestEnv());

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toContain('text/html');

    const html = await response.text();
    expect(html).toContain('About Gitversary');
    expect(html).toContain('@andreruffert');
  });

  it('sets a caching header', async () => {
    const response = await app.request('/about', {}, createTestEnv());

    expect(response.headers.get('Cache-Control')).toBe(
      'public, max-age=3600, stale-while-revalidate=86400',
    );
  });
});
