import { beforeEach, describe, expect, it, vi } from 'vitest';
import { app } from '../../src/index';
import { getGitHubAge } from '../../src/lib/github-age';
import { findProfile } from '../../src/lib/profiles';
import type { Bindings } from '../../src/types';

vi.mock('../../src/lib/profiles', () => ({
  findProfile: vi.fn(),
}));

vi.mock('../../src/lib/github-age', () => ({
  getGitHubAge: vi.fn(),
}));

const findProfileMock = vi.mocked(findProfile);
const getGitHubAgeMock = vi.mocked(getGitHubAge);

function createFakeImage(overrides: Record<string, unknown> = {}) {
  return {
    body: new Response('fake-image-bytes').body,
    httpMetadata: { contentType: 'image/webp', cacheControl: 'public, max-age=86400' },
    httpEtag: '"abc123"',
    ...overrides,
  };
}

function createTestEnv(overrides: Record<string, unknown> = {}): Bindings {
  return {
    DEFAULT_RATE_LIMITER: { limit: vi.fn().mockResolvedValue({ success: true }) },
    IMAGES: { get: vi.fn() },
    ...overrides,
  } as unknown as Bindings;
}

describe('GET /og', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // NOTE: requires the missing `import { OgImageDefault } from '../pages/og-image-default';`
  // in src/routes/og-image.ts — see the fix at the top of this reply.
  it('renders the default OG markup when render=1', async () => {
    const response = await app.request('/og?render=1', {}, createTestEnv());

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toContain('text/html');
    expect(response.headers.get('X-Robots-Tag')).toBe('noindex');

    const html = await response.text();
    expect(html).toContain('How long have you been on GitHub?');
  });

  it('serves the cached default image from R2', async () => {
    const image = createFakeImage();
    const env = createTestEnv({ IMAGES: { get: vi.fn().mockResolvedValue(image) } });

    const response = await app.request('/og', {}, env);

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('image/webp');
    expect(response.headers.get('Cache-Control')).toBe('public, max-age=31536000, immutable');
    expect(response.headers.get('ETag')).toBe('"abc123"');
    expect(env.IMAGES.get).toHaveBeenCalledWith('og/default.webp');
  });

  it('returns 404 when the default image is missing', async () => {
    const env = createTestEnv({ IMAGES: { get: vi.fn().mockResolvedValue(null) } });

    const response = await app.request('/og', {}, env);

    expect(response.status).toBe(404);
  });
});

describe('GET /og/:username', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 404 when the profile does not exist', async () => {
    findProfileMock.mockResolvedValue(null);

    const response = await app.request('/og/unknown-user', {}, createTestEnv());

    expect(response.status).toBe(404);
  });

  it('renders debug markup for an existing profile when render=1', async () => {
    findProfileMock.mockResolvedValue({
      username: 'octocat',
      avatarUrl: 'https://github.com/octocat.png',
      githubCreatedAt: '2011-01-25T00:00:00.000Z',
      imageKey: 'og/octocat/abc.webp',
      imageYears: 15,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    } as never);
    getGitHubAgeMock.mockReturnValue({ years: 15 } as never);

    const response = await app.request('/og/octocat?render=1', {}, createTestEnv());

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toContain('text/html');

    const html = await response.text();
    expect(html).toContain('@octocat');
  });

  it('computes the year fresh via getGitHubAge instead of trusting the stale imageYears column', async () => {
    findProfileMock.mockResolvedValue({
      username: 'octocat',
      avatarUrl: 'https://github.com/octocat.png',
      githubCreatedAt: '2011-01-25T00:00:00.000Z',
      imageKey: 'og/octocat/abc.webp',
      imageYears: 7, // stale: last cycle's stored year
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    } as never);
    getGitHubAgeMock.mockReturnValue({ years: 8 } as never); // this cycle's actual year

    const response = await app.request('/og/octocat?render=1', {}, createTestEnv());
    const html = await response.text();

    expect(getGitHubAgeMock).toHaveBeenCalledWith('2011-01-25T00:00:00.000Z', expect.anything());
    expect(html).toContain('class="og-profile__years">8</div>');
    expect(html).not.toContain('class="og-profile__years">7</div>');
  });

  it('renders a freshly computed year even when no image has ever been generated', async () => {
    findProfileMock.mockResolvedValue({
      username: 'octocat',
      avatarUrl: 'https://github.com/octocat.png',
      githubCreatedAt: '2011-01-25T00:00:00.000Z',
      imageKey: null,
      imageYears: null,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    } as never);
    getGitHubAgeMock.mockReturnValue({ years: 15 } as never);

    const response = await app.request('/og/octocat?render=1', {}, createTestEnv());
    const html = await response.text();

    expect(html).toContain('class="og-profile__years">15</div>');
  });

  it('serves the profile image from R2', async () => {
    findProfileMock.mockResolvedValue({
      username: 'octocat',
      imageKey: 'og/octocat/abc.webp',
      imageYears: 15,
    } as never);

    const image = createFakeImage({
      httpMetadata: {
        contentType: 'image/webp',
        cacheControl: 'public, max-age=86400, stale-while-revalidate=604800',
      },
    });
    const imagesGet = vi.fn().mockResolvedValue(image);
    const env = createTestEnv({ IMAGES: { get: imagesGet } });

    const response = await app.request('/og/octocat', {}, env);

    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe(
      'public, max-age=86400, stale-while-revalidate=604800',
    );
    expect(imagesGet).toHaveBeenCalledWith('og/octocat/abc.webp');
  });

  it('returns 404 when the stored image is missing from R2', async () => {
    findProfileMock.mockResolvedValue({
      username: 'octocat',
      imageKey: 'og/octocat/missing.webp',
      imageYears: 15,
    } as never);

    const imagesGet = vi.fn().mockResolvedValue(null);
    const env = createTestEnv({ IMAGES: { get: imagesGet } });

    const response = await app.request('/og/octocat', {}, env);

    expect(response.status).toBe(404);
    expect(imagesGet).toHaveBeenCalledWith('og/octocat/missing.webp');
  });

  it('returns 404 without calling R2 when the profile has no image yet', async () => {
    findProfileMock.mockResolvedValue({
      username: 'octocat',
      imageKey: null,
      imageYears: null,
    } as never);

    const imagesGet = vi.fn();
    const env = createTestEnv({ IMAGES: { get: imagesGet } });

    const response = await app.request('/og/octocat', {}, env);

    expect(response.status).toBe(404);
    expect(imagesGet).not.toHaveBeenCalled();
  });
});
