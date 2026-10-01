import { describe, expect, it, vi } from 'vitest';
import type { GitHubAccount, GitHubAccountStats } from '../../src/lib/github';
import {
  findProfile,
  getProfileCount,
  isExpired,
  saveProfile,
  setProfileImage,
} from '../../src/lib/profiles';

function createDb({
  first,
  run,
}: {
  first?: ReturnType<typeof vi.fn>;
  run?: ReturnType<typeof vi.fn>;
} = {}) {
  // A real D1PreparedStatement supports .first()/.run() directly (used by
  // getProfileCount, which has no parameters to bind) as well as after
  // .bind(...) (used by every other query here), so the fake statement
  // needs both entry points to resolve to the same first/run mocks.
  const statement = {
    first: first ?? vi.fn().mockResolvedValue(null),
    run: run ?? vi.fn().mockResolvedValue(undefined),
    bind: vi.fn(),
  };

  statement.bind.mockReturnValue(statement);

  const prepare = vi.fn().mockReturnValue(statement);

  return {
    db: { prepare } as unknown as D1Database,
    prepare,
    bind: statement.bind,
  };
}

describe('findProfile', () => {
  it('returns null when no profile exists', async () => {
    const { db } = createDb({
      first: vi.fn().mockResolvedValue(null),
    });

    expect(await findProfile(db, 'nobody')).toBeNull();
  });

  it('maps a row with no cached stats to zeroed stats', async () => {
    const row = {
      username: 'octocat',
      github_id: 1,
      github_account_type: 'User',
      avatar_url: 'https://github.com/octocat.png',
      github_url: 'https://github.com/octocat',
      github_created_at: '2011-01-25T00:00:00.000Z',
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
      expires_at: '2027-01-01T00:00:00.000Z',
      image_key: null,
      image_years: null,
      stats_json: null,
    };

    const { db, bind } = createDb({
      first: vi.fn().mockResolvedValue(row),
    });

    const result = await findProfile(db, 'octocat');

    expect(result).toEqual({
      username: 'octocat',
      githubId: 1,
      githubAccountType: 'User',
      avatarUrl: 'https://github.com/octocat.png',
      githubUrl: 'https://github.com/octocat',
      githubCreatedAt: '2011-01-25T00:00:00.000Z',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      expiresAt: '2027-01-01T00:00:00.000Z',
      imageKey: null,
      imageYears: null,
      stats: {
        publicRepos: 0,
        followers: 0,
        following: 0,
        pullRequests: 0,
        totalCommits: 0,
      },
    });

    expect(bind).toHaveBeenCalledWith('octocat');
  });

  it('maps an organization account', async () => {
    const row = {
      username: 'github',
      github_id: 1,
      github_account_type: 'Organization',
      avatar_url: 'https://github.com/github.png',
      github_url: 'https://github.com/github',
      github_created_at: '2008-02-11T00:00:00.000Z',
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
      expires_at: '2027-01-01T00:00:00.000Z',
      image_key: null,
      image_years: null,
      stats_json: null,
    };

    const { db } = createDb({
      first: vi.fn().mockResolvedValue(row),
    });

    const result = await findProfile(db, 'github');

    expect(result?.githubAccountType).toBe('Organization');
  });

  it('merges cached stats over the zeroed defaults', async () => {
    const row = {
      username: 'octocat',
      github_id: 1,
      github_account_type: 'User',
      avatar_url: 'https://github.com/octocat.png',
      github_url: 'https://github.com/octocat',
      github_created_at: '2011-01-25T00:00:00.000Z',
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
      expires_at: '2027-01-01T00:00:00.000Z',
      image_key: 'og/octocat/abc.webp',
      image_years: 15,
      stats_json: JSON.stringify({
        followers: 42,
        totalCommits: 900,
      }),
    };

    const { db } = createDb({
      first: vi.fn().mockResolvedValue(row),
    });

    const result = await findProfile(db, 'octocat');

    expect(result?.stats).toEqual({
      publicRepos: 0,
      followers: 42,
      following: 0,
      pullRequests: 0,
      totalCommits: 900,
    });
  });
});

describe('saveProfile', () => {
  const account: GitHubAccount = {
    id: 1,
    login: 'octocat',
    name: 'The Octocat',
    avatar_url: 'https://github.com/octocat.png',
    html_url: 'https://github.com/octocat',
    created_at: '2011-01-25T00:00:00.000Z',
    public_repos: 10,
    followers: 20,
    following: 5,
    type: 'User',
  };

  const stats: GitHubAccountStats = {
    pullRequests: 30,
    totalCommits: 400,
  };

  it('writes the profile row and computes an expiry one year out', async () => {
    const { db, bind, prepare } = createDb({
      first: vi.fn().mockResolvedValue({
        created_at: '2026-01-25T12:00:00.000Z',
        image_key: null,
        image_years: null,
      }),
    });

    const now = new Date('2026-01-25T12:00:00.000Z');

    const result = await saveProfile(db, account, stats, now);

    expect(result).toEqual({
      username: 'octocat',
      githubId: 1,
      githubAccountType: 'User',
      avatarUrl: 'https://github.com/octocat.png',
      githubUrl: 'https://github.com/octocat',
      githubCreatedAt: '2011-01-25T00:00:00.000Z',
      createdAt: '2026-01-25T12:00:00.000Z',
      updatedAt: '2026-01-25T12:00:00.000Z',
      expiresAt: '2027-01-25T12:00:00.000Z',
      imageKey: null,
      imageYears: null,
      stats: {
        publicRepos: 10,
        followers: 20,
        following: 5,
        pullRequests: 30,
        totalCommits: 400,
      },
    });

    expect(prepare).toHaveBeenCalledOnce();

    expect(bind).toHaveBeenCalledWith(
      'octocat',
      1,
      'User',
      'https://github.com/octocat.png',
      'https://github.com/octocat',
      '2011-01-25T00:00:00.000Z',
      '2026-01-25T12:00:00.000Z',
      '2026-01-25T12:00:00.000Z',
      '2027-01-25T12:00:00.000Z',
      JSON.stringify({
        publicRepos: 10,
        followers: 20,
        following: 5,
        pullRequests: 30,
        totalCommits: 400,
      }),
    );
  });

  it('saves an organization account type', async () => {
    const organization: GitHubAccount = {
      ...account,
      id: 2,
      login: 'github',
      name: 'GitHub',
      type: 'Organization',
    };

    const { db, bind } = createDb({
      first: vi.fn().mockResolvedValue({
        created_at: '2026-01-25T12:00:00.000Z',
        image_key: null,
        image_years: null,
      }),
    });

    await saveProfile(db, organization, stats);

    expect(bind).toHaveBeenCalledWith(
      'github',
      2,
      'Organization',
      'https://github.com/octocat.png',
      'https://github.com/octocat',
      '2011-01-25T00:00:00.000Z',
      expect.any(String),
      expect.any(String),
      expect.any(String),
      JSON.stringify({
        publicRepos: 10,
        followers: 20,
        following: 5,
        pullRequests: 30,
        totalCommits: 400,
      }),
    );
  });
});

describe('isExpired', () => {
  const profile = {
    expiresAt: '2027-01-01T00:00:00.000Z',
  } as never;

  it('returns false before the expiry date', () => {
    expect(isExpired(profile, new Date('2026-06-01T00:00:00.000Z'))).toBe(false);
  });

  it('returns true on and after the expiry date', () => {
    expect(isExpired(profile, new Date('2027-01-01T00:00:00.000Z'))).toBe(true);

    expect(isExpired(profile, new Date('2028-01-01T00:00:00.000Z'))).toBe(true);
  });
});

describe('setProfileImage', () => {
  it('updates the image key and year for a username', async () => {
    const { db, bind } = createDb();

    await setProfileImage(db, 'octocat', 'og/octocat/abc.webp', 15);

    expect(bind).toHaveBeenCalledWith('og/octocat/abc.webp', 15, 'octocat');
  });
});

describe('getProfileCount', () => {
  it('returns the row count', async () => {
    const { db } = createDb({
      first: vi.fn().mockResolvedValue({ count: 42 }),
    });

    expect(await getProfileCount(db)).toBe(42);
  });

  it('returns 0 when the query result is missing', async () => {
    const { db } = createDb({
      first: vi.fn().mockResolvedValue(null),
    });

    expect(await getProfileCount(db)).toBe(0);
  });
});
