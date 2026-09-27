import { Temporal } from '@js-temporal/polyfill';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getGitHubProfile } from '../../src/lib/github';
import { getGitHubAge } from '../../src/lib/github-age';
import { findProfile, isExpired, saveProfile } from '../../src/lib/profiles';
import { generateProfile } from '../../src/services/generate-profile';
import type { Bindings } from '../../src/types';

vi.mock('../../src/lib/github', () => ({
  getGitHubProfile: vi.fn(),
}));

vi.mock('../../src/lib/github-age', () => ({
  getGitHubAge: vi.fn(),
}));

vi.mock('../../src/lib/profiles', () => ({
  findProfile: vi.fn(),
  isExpired: vi.fn(),
  saveProfile: vi.fn(),
}));

const findProfileMock = vi.mocked(findProfile);
const isExpiredMock = vi.mocked(isExpired);
const saveProfileMock = vi.mocked(saveProfile);
const getGitHubProfileMock = vi.mocked(getGitHubProfile);
const getGitHubAgeMock = vi.mocked(getGitHubAge);

function createEnv(): Bindings {
  return {
    DB: {} as D1Database,
    IMAGE_QUEUE: {
      send: vi.fn().mockResolvedValue(undefined),
    },
  } as unknown as Bindings;
}

function createProfile(overrides = {}) {
  return {
    username: 'octocat',
    createdAt: '2011-01-25T00:00:00.000Z',
    imageKey: 'og/octocat/abc.webp',
    imageYears: 10,
    ...overrides,
  };
}

describe('generateProfile', () => {
  const today = Temporal.PlainDate.from('2026-01-25');

  beforeEach(() => {
    vi.clearAllMocks();

    getGitHubAgeMock.mockReturnValue({
      years: 15,
    } as ReturnType<typeof getGitHubAge>);
  });

  it('returns a cached profile when the profile is valid', async () => {
    const profile = createProfile();

    findProfileMock.mockResolvedValue(profile);
    isExpiredMock.mockReturnValue(false);

    const env = createEnv();

    const result = await generateProfile(env, 'octocat', today);

    expect(result).toEqual({
      source: 'cached',
      profile,
      age: { years: 15 },
    });

    expect(findProfileMock).toHaveBeenCalledOnce();
    expect(findProfileMock).toHaveBeenCalledWith(env.DB, 'octocat');

    expect(isExpiredMock).toHaveBeenCalledOnce();
    expect(isExpiredMock).toHaveBeenCalledWith(profile);

    expect(getGitHubProfileMock).not.toHaveBeenCalled();
    expect(saveProfileMock).not.toHaveBeenCalled();
  });

  it('fetches and saves the profile when it does not exist', async () => {
    const profile = createProfile({
      imageKey: 'og/octocat/abc.webp',
      imageYears: 15,
    });

    const user = {
      login: 'octocat',
    };

    const stats = {
      followers: 100,
    };

    findProfileMock.mockResolvedValue(null);
    getGitHubProfileMock.mockResolvedValue({ user, stats });
    saveProfileMock.mockResolvedValue(profile);

    const env = createEnv();

    const result = await generateProfile(env, 'octocat', today);

    expect(getGitHubProfileMock).toHaveBeenCalledOnce();
    expect(getGitHubProfileMock).toHaveBeenCalledWith('octocat', env);

    expect(saveProfileMock).toHaveBeenCalledOnce();
    expect(saveProfileMock).toHaveBeenCalledWith(env.DB, user, stats);

    expect(result.source).toBe('github');
    expect(result.profile).toBe(profile);
  });

  it('refreshes an expired profile', async () => {
    const oldProfile = createProfile({
      imageKey: 'og/octocat/old.webp',
      imageYears: 15,
    });

    const newProfile = createProfile({
      imageKey: 'og/octocat/new.webp',
      imageYears: 15,
    });

    const user = {
      login: 'octocat',
    };

    const stats = {
      followers: 200,
    };

    findProfileMock.mockResolvedValue(oldProfile);
    isExpiredMock.mockReturnValue(true);
    getGitHubProfileMock.mockResolvedValue({ user, stats });
    saveProfileMock.mockResolvedValue(newProfile);

    const env = createEnv();

    const result = await generateProfile(env, 'octocat', today);

    expect(getGitHubProfileMock).toHaveBeenCalledWith('octocat', env);
    expect(saveProfileMock).toHaveBeenCalledWith(env.DB, user, stats);

    expect(result.source).toBe('github');
    expect(result.profile).toBe(newProfile);
  });

  it('queues image generation when the profile has no image', async () => {
    const profile = createProfile({
      imageKey: null,
      imageYears: null,
    });

    findProfileMock.mockResolvedValue(profile);
    isExpiredMock.mockReturnValue(false);

    getGitHubAgeMock.mockReturnValue({
      years: 15,
    } as ReturnType<typeof getGitHubAge>);

    const env = createEnv();

    await generateProfile(env, 'octocat', today);

    expect(env.IMAGE_QUEUE.send).toHaveBeenCalledOnce();

    expect(env.IMAGE_QUEUE.send).toHaveBeenCalledWith(
      expect.objectContaining({
        createdAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
        data: {
          username: 'octocat',
          years: 15,
        },
      }),
    );
  });

  it('queues image generation when the image is from an older year', async () => {
    const profile = createProfile({
      imageKey: 'og/octocat/old.webp',
      imageYears: 14,
    });

    findProfileMock.mockResolvedValue(profile);
    isExpiredMock.mockReturnValue(false);

    getGitHubAgeMock.mockReturnValue({
      years: 15,
    } as ReturnType<typeof getGitHubAge>);

    const env = createEnv();

    await generateProfile(env, 'octocat', today);

    expect(env.IMAGE_QUEUE.send).toHaveBeenCalledOnce();

    expect(env.IMAGE_QUEUE.send).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          username: 'octocat',
          years: 15,
        },
      }),
    );
  });

  it('does not queue image generation when the image is current', async () => {
    const profile = createProfile({
      imageKey: 'og/octocat/current.webp',
      imageYears: 15,
    });

    findProfileMock.mockResolvedValue(profile);
    isExpiredMock.mockReturnValue(false);

    getGitHubAgeMock.mockReturnValue({
      years: 15,
    } as ReturnType<typeof getGitHubAge>);

    const env = createEnv();

    await generateProfile(env, 'octocat', today);

    expect(env.IMAGE_QUEUE.send).not.toHaveBeenCalled();
  });

  it('passes the supplied date to getGitHubAge', async () => {
    const profile = createProfile();

    findProfileMock.mockResolvedValue(profile);
    isExpiredMock.mockReturnValue(false);

    const env = createEnv();

    await generateProfile(env, 'octocat', today);

    expect(getGitHubAgeMock).toHaveBeenCalledOnce();
    expect(getGitHubAgeMock).toHaveBeenCalledWith(profile.githubCreatedAt, today);
  });
});
