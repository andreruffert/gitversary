import { beforeEach, describe, expect, it, vi } from 'vitest';
import { app } from '../../src/index';
import { generateProfile } from '../../src/services/generate-profile';
import type { Bindings } from '../../src/types';

vi.mock('../../src/services/generate-profile', () => ({
  generateProfile: vi.fn(),
}));

const generateProfileMock = vi.mocked(generateProfile);

function createTestEnv(overrides: Record<string, unknown> = {}): Bindings {
  return {
    DEFAULT_RATE_LIMITER: { limit: vi.fn().mockResolvedValue({ success: true }) },
    ...overrides,
  } as unknown as Bindings;
}

function createGeneratedProfile(overrides: Record<string, unknown> = {}) {
  return {
    source: 'cached' as const,
    profile: {
      username: 'octocat',
      githubId: 1,
      avatarUrl: 'https://github.com/octocat.png',
      githubUrl: 'https://github.com/octocat',
      githubCreatedAt: '2011-01-25T00:00:00.000Z',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      expiresAt: '2027-01-01T00:00:00.000Z',
      imageKey: 'og/octocat/abc.webp',
      imageYears: 15,
      stats: {
        publicRepos: 10,
        followers: 20,
        following: 5,
        pullRequests: 30,
        totalCommits: 400,
      },
    },
    age: { years: 15 },
    ...overrides,
  };
}

describe('GET /:username', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the profile page for a valid username', async () => {
    generateProfileMock.mockResolvedValue(createGeneratedProfile() as never);

    const response = await app.request('/octocat', {}, createTestEnv());

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toContain('text/html');
    expect(response.headers.get('Cache-Control')).toBe(
      'public, max-age=300, stale-while-revalidate=3600',
    );

    const html = await response.text();

    expect(html).toContain('@octocat');
    expect(html).toContain('15 years on GitHub');
    expect(html).toContain('og/octocat?v=tZD5m2hR');

    expect(generateProfileMock).toHaveBeenCalledOnce();
    expect(generateProfileMock).toHaveBeenCalledWith(expect.anything(), 'octocat');
  });

  it('returns 500 and does not leak error details when generation fails', async () => {
    generateProfileMock.mockRejectedValue(new Error('GitHub API is down'));

    const response = await app.request('/octocat', {}, createTestEnv());

    expect(response.status).toBe(500);
    expect(await response.text()).toBe('Unable to generate this Gitversary.');
  });

  it('builds a desktop Bluesky share link by default', async () => {
    generateProfileMock.mockResolvedValue(createGeneratedProfile() as never);

    const response = await app.request('/octocat', {}, createTestEnv());
    const html = await response.text();

    expect(html).toContain('https://bsky.app/intent/compose?text=');
  });

  it('builds a mobile Bluesky deep link for mobile user agents', async () => {
    generateProfileMock.mockResolvedValue(createGeneratedProfile() as never);

    const response = await app.request(
      '/octocat',
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
        },
      },
      createTestEnv(),
    );
    const html = await response.text();

    expect(html).toContain('bluesky://intent/compose?text=');
  });
});
