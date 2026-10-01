import type { Bindings } from '../types';
import { getGitHubInstallationToken } from './github-app';

const GITHUB_API = 'https://api.github.com';
const GITHUB_GRAPHQL_API = 'https://api.github.com/graphql';

export type GitHubAccountType = 'User' | 'Organization';

export type GitHubAccount = {
  id: number;
  login: string;
  name: string | null;
  avatar_url: string;
  html_url: string;
  created_at: string;
  public_repos: number;
  followers: number;
  following: number;
  type: GitHubAccountType;
};

export type GitHubAccountStats = {
  pullRequests: number;
  totalCommits: number;
};

type GitHubError = {
  message?: string;
};

export class GitHubNotFoundError extends Error {
  constructor(username: string) {
    super(`GitHub account "${username}" was not found`);
    this.name = 'GitHubNotFoundError';
  }
}

export class GitHubApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'GitHubApiError';
  }
}

export class GitHubRateLimitError extends GitHubApiError {
  constructor(
    message: string,
    status: number,
    public readonly resetAt: number | null,
  ) {
    super(message, status);
    this.name = 'GitHubRateLimitError';
  }
}

function githubHeaders(token: string): HeadersInit {
  return {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${token}`,
    'X-GitHub-Api-Version': '2026-03-10',
    'User-Agent': 'gitversary-app',
  };
}

async function handleGitHubError(response: Response, fallbackMessage: string): Promise<never> {
  let message = fallbackMessage;

  try {
    const error = (await response.json()) as GitHubError;

    if (error.message) {
      message = error.message;
    }
  } catch {
    // Ignore invalid error response.
  }

  if (response.status === 403 || response.status === 429) {
    const remaining = response.headers.get('x-ratelimit-remaining');

    if (remaining === '0') {
      const reset = response.headers.get('x-ratelimit-reset');

      throw new GitHubRateLimitError(
        'GitHub API rate limit exceeded',
        response.status,
        reset ? Number(reset) : null,
      );
    }
  }

  throw new GitHubApiError(message, response.status);
}

export async function getGitHubAccount(username: string, env: Bindings): Promise<GitHubAccount> {
  const token = await getGitHubInstallationToken(env);

  const response = await fetch(`${GITHUB_API}/users/${encodeURIComponent(username)}`, {
    headers: githubHeaders(token),
  });

  if (response.status === 404) {
    throw new GitHubNotFoundError(username);
  }

  if (!response.ok) {
    return handleGitHubError(response, `GitHub API returned ${response.status}`);
  }

  return response.json() as Promise<GitHubAccount>;
}

type GitHubGraphQLResponse<T> = {
  data?: T;
  errors?: Array<{
    message: string;
  }>;
};

async function githubGraphQL<T>(
  query: string,
  variables: Record<string, unknown>,
  token: string,
): Promise<T> {
  const response = await fetch(GITHUB_GRAPHQL_API, {
    method: 'POST',
    headers: {
      ...githubHeaders(token),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  });

  if (!response.ok) {
    throw new GitHubApiError(`GitHub GraphQL API returned ${response.status}`, response.status);
  }

  const result = (await response.json()) as GitHubGraphQLResponse<T>;

  if (result.errors?.length) {
    throw new GitHubApiError(
      result.errors.map((error) => error.message).join(', '),
      response.status,
    );
  }

  if (!result.data) {
    throw new GitHubApiError('GitHub GraphQL API returned no data', response.status);
  }

  return result.data;
}

type GitHubProfileStatsResponse = {
  user: {
    contributionsCollection: {
      totalCommitContributions: number;
      totalPullRequestContributions: number;
    };
  } | null;
};

const USER_PROFILE_STATS_QUERY = `
  query GitversaryUserProfileStats(
    $login: String!
    $from: DateTime!
    $to: DateTime!
  ) {
    user(login: $login) {
      contributionsCollection(from: $from, to: $to) {
        totalCommitContributions
        totalPullRequestContributions
      }
    }
  }
`;

async function getGitHubUserStatsForYear(
  username: string,
  year: number,
  token: string,
): Promise<GitHubAccountStats> {
  const from = `${year}-01-01T00:00:00Z`;
  const to = `${year}-12-31T23:59:59Z`;

  const data = await githubGraphQL<GitHubProfileStatsResponse>(
    USER_PROFILE_STATS_QUERY,
    {
      login: username,
      from,
      to,
    },
    token,
  );

  if (!data.user) {
    throw new GitHubNotFoundError(username);
  }

  const contributions = data.user.contributionsCollection;

  return {
    pullRequests: contributions.totalPullRequestContributions,
    totalCommits: contributions.totalCommitContributions,
  };
}

type GitHubOrganizationRepositoriesResponse = {
  organization: {
    repositories: {
      pageInfo: {
        hasNextPage: boolean;
        endCursor: string | null;
      };
      nodes: Array<{
        name: string;
        isFork: boolean;
        isArchived: boolean;
        defaultBranchRef: {
          target: {
            __typename: string;
            history?: {
              totalCount: number;
            };
          } | null;
        } | null;
      } | null>;
    };
  } | null;
};

const ORGANIZATION_REPOSITORIES_QUERY = `
  query GitversaryOrganizationRepositories(
    $login: String!
    $after: String
    $from: GitTimestamp!
    $to: GitTimestamp!
  ) {
    organization(login: $login) {
      repositories(
        first: 100
        after: $after
        isFork: false
        isArchived: false
      ) {
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          name
          isFork
          isArchived
          defaultBranchRef {
            target {
              __typename
              ... on Commit {
                history(
                  first: 0
                  since: $from
                  until: $to
                ) {
                  totalCount
                }
              }
            }
          }
        }
      }
    }
  }
`;

type GitHubSearchResponse = {
  search: {
    issueCount: number;
  };
};

const ORGANIZATION_PULL_REQUESTS_QUERY = `
  query GitversaryOrganizationPullRequests(
    $query: String!
  ) {
    search(
      type: ISSUE
      query: $query
      first: 1
    ) {
      issueCount
    }
  }
`;

async function getGitHubOrganizationCommitCountForYear(
  organization: string,
  year: number,
  token: string,
): Promise<number> {
  const from = `${year}-01-01T00:00:00Z`;
  const to = `${year}-12-31T23:59:59Z`;

  let after: string | null = null;
  let totalCommits = 0;

  do {
    const data = await githubGraphQL<GitHubOrganizationRepositoriesResponse>(
      ORGANIZATION_REPOSITORIES_QUERY,
      {
        login: organization,
        after,
        from,
        to,
      },
      token,
    );

    if (!data.organization) {
      throw new GitHubNotFoundError(organization);
    }

    for (const repository of data.organization.repositories.nodes) {
      if (
        !repository ||
        repository.isFork ||
        repository.isArchived ||
        !repository.defaultBranchRef
      ) {
        continue;
      }

      const target = repository.defaultBranchRef.target;

      if (!target || target.__typename !== 'Commit' || !target.history) {
        continue;
      }

      totalCommits += target.history.totalCount;
    }

    const { pageInfo } = data.organization.repositories;

    after = pageInfo.hasNextPage ? pageInfo.endCursor : null;
  } while (after);

  return totalCommits;
}

async function getGitHubOrganizationPullRequestCountForYear(
  organization: string,
  year: number,
  token: string,
): Promise<number> {
  const from = `${year}-01-01`;
  const to = `${year}-12-31`;

  const query = [`org:${organization}`, 'is:pr', `created:${from}..${to}`].join(' ');

  const data = await githubGraphQL<GitHubSearchResponse>(
    ORGANIZATION_PULL_REQUESTS_QUERY,
    {
      query,
    },
    token,
  );

  return data.search.issueCount;
}

async function getGitHubOrganizationStatsForYear(
  organization: string,
  year: number,
  token: string,
): Promise<GitHubAccountStats> {
  const [totalCommits, pullRequests] = await Promise.all([
    getGitHubOrganizationCommitCountForYear(organization, year, token),
    getGitHubOrganizationPullRequestCountForYear(organization, year, token),
  ]);

  return {
    totalCommits,
    pullRequests,
  };
}

async function getGitHubProfileStatsForYear(
  username: string,
  year: number,
  accountType: GitHubAccountType,
  token: string,
): Promise<GitHubAccountStats> {
  if (accountType === 'Organization') {
    return getGitHubOrganizationStatsForYear(username, year, token);
  }

  return getGitHubUserStatsForYear(username, year, token);
}

export async function getGitHubProfileStats(
  username: string,
  createdAt: string,
  accountType: GitHubAccountType,
  env: Bindings,
): Promise<GitHubAccountStats> {
  const token = await getGitHubInstallationToken(env);

  const currentYear = new Date().getUTCFullYear();
  const joinedYear = new Date(createdAt).getUTCFullYear();

  const years = Array.from(
    { length: currentYear - joinedYear + 1 },
    (_, index) => joinedYear + index,
  );

  const yearlyStats = await Promise.all(
    years.map((year) => getGitHubProfileStatsForYear(username, year, accountType, token)),
  );

  return yearlyStats.reduce(
    (total, stats) => ({
      pullRequests: total.pullRequests + stats.pullRequests,
      totalCommits: total.totalCommits + stats.totalCommits,
    }),
    {
      pullRequests: 0,
      totalCommits: 0,
    },
  );
}

export async function getGitHubProfile(
  username: string,
  env: Bindings,
): Promise<{
  account: GitHubAccount;
  stats: GitHubAccountStats;
}> {
  const account = await getGitHubAccount(username, env);

  const stats = await getGitHubProfileStats(username, account.created_at, account.type, env);

  return {
    account,
    stats,
  };
}
