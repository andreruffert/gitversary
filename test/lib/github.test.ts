import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  GitHubApiError,
  GitHubNotFoundError,
  GitHubRateLimitError,
  getGitHubAccount,
  getGitHubProfile,
  getGitHubProfileStats,
} from '../../src/lib/github';
import { getGitHubInstallationToken } from '../../src/lib/github-app';
import type { Bindings } from '../../src/types';

vi.mock('../../src/lib/github-app', () => ({
  getGitHubInstallationToken: vi.fn(),
}));

const getGitHubInstallationTokenMock = vi.mocked(getGitHubInstallationToken);

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
}

const env = {} as Bindings;

describe('getGitHubAccount', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    getGitHubInstallationTokenMock.mockResolvedValue('test-token');
  });

  it('returns the account for a valid username', async () => {
    const account = { id: 1, login: 'octocat', type: 'User' };

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(account)));

    const result = await getGitHubAccount('octocat', env);

    expect(result).toEqual(account);
    expect(fetch).toHaveBeenCalledWith(
      'https://api.github.com/users/octocat',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer test-token' }),
      }),
    );
  });

  it('returns an organization account', async () => {
    const account = {
      id: 1,
      login: 'github',
      type: 'Organization',
    };

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(account)));

    const result = await getGitHubAccount('github', env);

    expect(result).toEqual(account);
    expect(result.type).toBe('Organization');
  });

  it('encodes usernames in the request path', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse({
          id: 1,
          login: 'a b',
          type: 'User',
        }),
      ),
    );

    await getGitHubAccount('a b', env);

    expect(fetch).toHaveBeenCalledWith('https://api.github.com/users/a%20b', expect.anything());
  });

  it('throws GitHubNotFoundError for a 404', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 404 })));

    await expect(getGitHubAccount('missing-account', env)).rejects.toThrow(GitHubNotFoundError);
  });

  it('throws GitHubRateLimitError when the rate limit is exhausted', async () => {
    const response = new Response(JSON.stringify({ message: 'rate limited' }), {
      status: 403,
      headers: {
        'x-ratelimit-remaining': '0',
        'x-ratelimit-reset': '1700000000',
      },
    });

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response));

    const error = (await getGitHubAccount('octocat', env).catch((e) => e)) as GitHubRateLimitError;

    expect(error).toBeInstanceOf(GitHubRateLimitError);
    expect(error.status).toBe(403);
    expect(error.resetAt).toBe(1700000000);
  });

  it('does not treat a 403 with remaining requests as a rate limit error', async () => {
    const response = new Response(JSON.stringify({ message: 'Forbidden' }), {
      status: 403,
      headers: { 'x-ratelimit-remaining': '10' },
    });

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response));

    const error = (await getGitHubAccount('octocat', env).catch((e) => e)) as GitHubApiError;

    expect(error).toBeInstanceOf(GitHubApiError);
    expect(error).not.toBeInstanceOf(GitHubRateLimitError);
  });

  it('throws GitHubApiError with the upstream message for other failures', async () => {
    const response = new Response(JSON.stringify({ message: 'Server error' }), { status: 500 });

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response));

    const error = (await getGitHubAccount('octocat', env).catch((e) => e)) as GitHubApiError;

    expect(error).toBeInstanceOf(GitHubApiError);
    expect(error.message).toBe('Server error');
    expect(error.status).toBe(500);
  });

  it('falls back to a generic message when the error body is not JSON', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('oops', { status: 502 })));

    const error = (await getGitHubAccount('octocat', env).catch((e) => e)) as GitHubApiError;

    expect(error.message).toBe('GitHub API returned 502');
  });
});

describe('getGitHubProfileStats', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-15T00:00:00Z'));
    getGitHubInstallationTokenMock.mockResolvedValue('test-token');
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('sums commit and PR contributions across every joined year for a user', async () => {
    const fetchMock = vi.fn().mockImplementation((_url, init) => {
      const body = JSON.parse(init.body as string);
      const year = Number(body.variables.from.slice(0, 4));

      return Promise.resolve(
        jsonResponse({
          data: {
            user: {
              contributionsCollection: {
                totalCommitContributions: year === 2024 ? 100 : 50,
                totalPullRequestContributions: year === 2024 ? 10 : 5,
              },
            },
          },
        }),
      );
    });

    vi.stubGlobal('fetch', fetchMock);

    const result = await getGitHubProfileStats('octocat', '2024-03-01T00:00:00Z', 'User', env);

    // Joined 2024, "now" is 2026 -> three years: 2024, 2025, 2026.
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(result.totalCommits).toBe(100 + 50 + 50);
    expect(result.pullRequests).toBe(10 + 5 + 5);
  });

  it('makes a single request for a user created this year', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        data: {
          user: {
            contributionsCollection: {
              totalCommitContributions: 5,
              totalPullRequestContributions: 1,
            },
          },
        },
      }),
    );

    vi.stubGlobal('fetch', fetchMock);

    const result = await getGitHubProfileStats('octocat', '2026-06-01T00:00:00Z', 'User', env);

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(result).toEqual({ totalCommits: 5, pullRequests: 1 });
  });

  it('throws GitHubNotFoundError when the GraphQL user is null', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse({
          data: {
            user: null,
          },
        }),
      ),
    );

    await expect(
      getGitHubProfileStats('missing', '2026-01-01T00:00:00Z', 'User', env),
    ).rejects.toThrow(GitHubNotFoundError);
  });

  it('throws GitHubApiError when the GraphQL response has errors', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse({
          errors: [{ message: 'Bad credentials' }],
        }),
      ),
    );

    await expect(
      getGitHubProfileStats('octocat', '2026-01-01T00:00:00Z', 'User', env),
    ).rejects.toThrow('Bad credentials');
  });

  it('throws GitHubApiError when the GraphQL endpoint itself fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 502 })));

    await expect(
      getGitHubProfileStats('octocat', '2026-01-01T00:00:00Z', 'User', env),
    ).rejects.toThrow(GitHubApiError);
  });

  it('aggregates organization commits and pull requests', async () => {
    const fetchMock = vi
      .fn()
      // Organization repositories query.
      .mockResolvedValueOnce(
        jsonResponse({
          data: {
            organization: {
              repositories: {
                pageInfo: {
                  hasNextPage: false,
                  endCursor: null,
                },
                nodes: [
                  {
                    name: 'repo-one',
                    isFork: false,
                    isArchived: false,
                    defaultBranchRef: {
                      target: {
                        __typename: 'Commit',
                        history: {
                          totalCount: 100,
                        },
                      },
                    },
                  },
                  {
                    name: 'repo-two',
                    isFork: false,
                    isArchived: false,
                    defaultBranchRef: {
                      target: {
                        __typename: 'Commit',
                        history: {
                          totalCount: 50,
                        },
                      },
                    },
                  },
                  {
                    name: 'forked-repo',
                    isFork: true,
                    isArchived: false,
                    defaultBranchRef: {
                      target: {
                        __typename: 'Commit',
                        history: {
                          totalCount: 999,
                        },
                      },
                    },
                  },
                  {
                    name: 'archived-repo',
                    isFork: false,
                    isArchived: true,
                    defaultBranchRef: {
                      target: {
                        __typename: 'Commit',
                        history: {
                          totalCount: 999,
                        },
                      },
                    },
                  },
                ],
              },
            },
          },
        }),
      )
      // Organization PR search query.
      .mockResolvedValueOnce(
        jsonResponse({
          data: {
            search: {
              issueCount: 25,
            },
          },
        }),
      );

    vi.stubGlobal('fetch', fetchMock);

    const result = await getGitHubProfileStats(
      'github',
      '2026-01-01T00:00:00Z',
      'Organization',
      env,
    );

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result).toEqual({
      totalCommits: 150,
      pullRequests: 25,
    });

    const repositoryRequest = JSON.parse(fetchMock.mock.calls[0][1].body as string);

    expect(repositoryRequest.variables.login).toBe('github');
    expect(repositoryRequest.variables.from).toBe('2026-01-01T00:00:00Z');
    expect(repositoryRequest.variables.to).toBe('2026-12-31T23:59:59Z');

    const pullRequestRequest = JSON.parse(fetchMock.mock.calls[1][1].body as string);

    expect(pullRequestRequest.variables.query).toBe(
      'org:github is:pr created:2026-01-01..2026-12-31',
    );
  });

  it('paginates organization repositories', async () => {
    const fetchMock = vi.fn().mockImplementation((_url, init) => {
      const body = JSON.parse(init.body as string);

      if (body.query.includes('GitversaryOrganizationRepositories')) {
        const after = body.variables.after;

        if (after === null) {
          return Promise.resolve(
            jsonResponse({
              data: {
                organization: {
                  repositories: {
                    pageInfo: {
                      hasNextPage: true,
                      endCursor: 'cursor-2',
                    },
                    nodes: [
                      {
                        name: 'repo-one',
                        isFork: false,
                        isArchived: false,
                        defaultBranchRef: {
                          target: {
                            __typename: 'Commit',
                            history: {
                              totalCount: 100,
                            },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            }),
          );
        }

        return Promise.resolve(
          jsonResponse({
            data: {
              organization: {
                repositories: {
                  pageInfo: {
                    hasNextPage: false,
                    endCursor: null,
                  },
                  nodes: [
                    {
                      name: 'repo-two',
                      isFork: false,
                      isArchived: false,
                      defaultBranchRef: {
                        target: {
                          __typename: 'Commit',
                          history: {
                            totalCount: 50,
                          },
                        },
                      },
                    },
                  ],
                },
              },
            },
          }),
        );
      }

      if (body.query.includes('GitversaryOrganizationPullRequests')) {
        return Promise.resolve(
          jsonResponse({
            data: {
              search: {
                issueCount: 25,
              },
            },
          }),
        );
      }

      throw new Error(`Unexpected GraphQL query: ${body.query}`);
    });

    vi.stubGlobal('fetch', fetchMock);

    const result = await getGitHubProfileStats(
      'github',
      '2026-01-01T00:00:00Z',
      'Organization',
      env,
    );

    expect(result).toEqual({
      totalCommits: 150,
      pullRequests: 25,
    });
  });

  it('throws GitHubNotFoundError when the organization is null', async () => {
    const fetchMock = vi.fn().mockImplementation((_url, init) => {
      const body = JSON.parse(init.body as string);

      if (body.query.includes('GitversaryOrganizationRepositories')) {
        return Promise.resolve(
          jsonResponse({
            data: {
              organization: null,
            },
          }),
        );
      }

      if (body.query.includes('GitversaryOrganizationPullRequests')) {
        return Promise.resolve(
          jsonResponse({
            data: {
              search: {
                issueCount: 0,
              },
            },
          }),
        );
      }

      throw new Error(`Unexpected GraphQL query: ${body.query}`);
    });

    vi.stubGlobal('fetch', fetchMock);

    await expect(
      getGitHubProfileStats('missing-org', '2026-01-01T00:00:00Z', 'Organization', env),
    ).rejects.toThrow(GitHubNotFoundError);
  });
});

describe('getGitHubProfile', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-15T00:00:00Z'));
    getGitHubInstallationTokenMock.mockResolvedValue('test-token');
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('combines the account and its contribution stats', async () => {
    const account = { id: 1, login: 'octocat', type: 'User', created_at: '2026-01-01T00:00:00Z' };

    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(jsonResponse(account))
        .mockResolvedValueOnce(
          jsonResponse({
            data: {
              user: {
                contributionsCollection: {
                  totalCommitContributions: 12,
                  totalPullRequestContributions: 3,
                },
              },
            },
          }),
        ),
    );

    const result = await getGitHubProfile('octocat', env);

    expect(result.account).toEqual(account);
    expect(result.stats).toEqual({ pullRequests: 3, totalCommits: 12 });
  });
});
