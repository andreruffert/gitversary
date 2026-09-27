import { beforeEach, describe, expect, it, vi } from 'vitest';
import { processGitversaryImage } from '../../src/jobs/gitversary-image';
import { setProfileImage } from '../../src/lib/profiles';
import type { Bindings } from '../../src/types';

vi.mock('../../src/lib/profiles', () => ({
  setProfileImage: vi.fn(),
}));

const setProfileImageMock = vi.mocked(setProfileImage);

function createJob(overrides: Record<string, unknown> = {}) {
  return {
    id: 'job-1',
    createdAt: new Date().toISOString(),
    data: { username: 'octocat', years: 5 },
    ...overrides,
  } as never;
}

function createEnv(overrides: Record<string, unknown> = {}): Bindings {
  return {
    BROWSER: { quickAction: vi.fn() },
    IMAGES: { put: vi.fn().mockResolvedValue(undefined) },
    DB: {} as D1Database,
    ...overrides,
  } as unknown as Bindings;
}

describe('processGitversaryImage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    // restoreAllMocks only affects vi.spyOn() spies (like the crypto stub
    // below) — it doesn't reset call history on vi.mock()-created mocks
    // like setProfileImageMock, so that needs an explicit clear.
    setProfileImageMock.mockClear();
    vi.spyOn(crypto, 'randomUUID').mockReturnValue('fixed-uuid' as never);
  });

  it('screenshots the OG page, stores it in R2, and updates the profile', async () => {
    const screenshot = {
      ok: true,
      body: {},
      arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(8)),
      text: vi.fn().mockResolvedValue(''),
    };

    const env = createEnv({ BROWSER: { quickAction: vi.fn().mockResolvedValue(screenshot) } });

    await processGitversaryImage(createJob(), env);

    expect(env.BROWSER.quickAction).toHaveBeenCalledWith(
      'screenshot',
      expect.objectContaining({
        url: expect.stringContaining('/og/octocat?render=1'),
        selector: '.og-canvas',
        viewport: { width: 1200, height: 630 },
      }),
    );

    expect(env.IMAGES.put).toHaveBeenCalledWith(
      'og/octocat/fixed-uuid.webp',
      expect.any(ArrayBuffer),
      expect.objectContaining({
        httpMetadata: expect.objectContaining({ contentType: 'image/webp' }),
      }),
    );

    expect(setProfileImageMock).toHaveBeenCalledWith(
      env.DB,
      'octocat',
      'og/octocat/fixed-uuid.webp',
      5,
    );
  });

  it('throws and skips storage when the screenshot response is not ok', async () => {
    const screenshot = {
      ok: false,
      body: null,
      text: vi.fn().mockResolvedValue('render timed out'),
    };

    const env = createEnv({ BROWSER: { quickAction: vi.fn().mockResolvedValue(screenshot) } });

    await expect(processGitversaryImage(createJob(), env)).rejects.toThrow('Screenshot failed');

    expect(env.IMAGES.put).not.toHaveBeenCalled();
    expect(setProfileImageMock).not.toHaveBeenCalled();
  });

  it('throws when the screenshot response is ok but has no body', async () => {
    const screenshot = {
      ok: true,
      body: null,
      text: vi.fn().mockResolvedValue(''),
    };

    const env = createEnv({ BROWSER: { quickAction: vi.fn().mockResolvedValue(screenshot) } });

    await expect(processGitversaryImage(createJob(), env)).rejects.toThrow('Screenshot failed');
    expect(env.IMAGES.put).not.toHaveBeenCalled();
  });

  it('keys each stored image by username and a fresh UUID', async () => {
    const screenshot = {
      ok: true,
      body: {},
      arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(4)),
      text: vi.fn().mockResolvedValue(''),
    };

    const env = createEnv({ BROWSER: { quickAction: vi.fn().mockResolvedValue(screenshot) } });

    await processGitversaryImage(createJob({ data: { username: 'monalisa', years: 8 } }), env);

    expect(env.IMAGES.put).toHaveBeenCalledWith(
      'og/monalisa/fixed-uuid.webp',
      expect.any(ArrayBuffer),
      expect.anything(),
    );
    expect(setProfileImageMock).toHaveBeenCalledWith(
      env.DB,
      'monalisa',
      'og/monalisa/fixed-uuid.webp',
      8,
    );
  });
});
