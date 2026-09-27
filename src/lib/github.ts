import type { Bindings } from '../types';
import { getGitHubInstallationToken } from './github-app';

const GITHUB_API = 'https://api.github.com';
const GITHUB_GRAPHQL_API = 'https://api.github.com/graphql';

export type GitHubUser = {
  id: number;
  login: string;
  name: string | null;
  avatar_url: string;
  html_url: string;
  created_at: string;
  public_repos: number;
  followers: number;
  following: number;
};

export type GitHubUserStats = {
  pullRequests: number;
  totalCommits: number;
};

type GitHubError = {
  message?: string;
};

export class GitHubNotFoundError extends Error {
  constructor(username: string) {
    super(`GitHub user "${username}" was not found`);
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

export async function getGitHubUser(username: string, env: Bindings): Promise<GitHubUser> {
  const token = await getGitHubInstallationToken(env);

  const response = await fetch(`${GITHUB_API}/users/${encodeURIComponent(username)}`, {
    headers: githubHeaders(token),
  });

  if (response.status === 404) {
    throw new GitHubNotFoundError(username);
  }

  if (!response.ok) {
    let message = `GitHub API returned ${response.status}`;

    try {
      const error = (await response.json()) as GitHubError;

      if (error.message) {
        message = error.message;
      }
    } catch {
      // Ignore invalid error response
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

  return response.json() as Promise<GitHubUser>;
}

type GitHubGraphQLResponse<T> = {
  data?: T;
  errors?: Array<{
    message: string;
  }>;
};

type GitHubProfileStatsResponse = {
  user: {
    contributionsCollection: {
      totalCommitContributions: number;
      totalPullRequestContributions: number;
    };
  } | null;
};

const PROFILE_STATS_QUERY = `
  query GitversaryProfileStats(
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

async function getGitHubProfileStatsForYear(
  username: string,
  year: number,
  token: string,
): Promise<GitHubUserStats> {
  const from = `${year}-01-01T00:00:00Z`;
  const to = `${year}-12-31T23:59:59Z`;

  const response = await fetch(GITHUB_GRAPHQL_API, {
    method: 'POST',
    headers: {
      ...githubHeaders(token),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: PROFILE_STATS_QUERY,
      variables: {
        login: username,
        from,
        to,
      },
    }),
  });

  if (!response.ok) {
    throw new GitHubApiError(`GitHub GraphQL API returned ${response.status}`, response.status);
  }

  const result = (await response.json()) as GitHubGraphQLResponse<GitHubProfileStatsResponse>;

  if (result.errors?.length) {
    throw new GitHubApiError(
      result.errors.map((error) => error.message).join(', '),
      response.status,
    );
  }

  if (!result.data?.user) {
    throw new GitHubNotFoundError(username);
  }

  const contributions = result.data.user.contributionsCollection;

  return {
    pullRequests: contributions.totalPullRequestContributions,
    totalCommits: contributions.totalCommitContributions,
  };
}

export async function getGitHubProfileStats(
  username: string,
  createdAt: string,
  env: Bindings,
): Promise<GitHubUserStats> {
  const token = await getGitHubInstallationToken(env);

  const currentYear = new Date().getUTCFullYear();
  const joinedYear = new Date(createdAt).getUTCFullYear();

  const years = Array.from(
    { length: currentYear - joinedYear + 1 },
    (_, index) => joinedYear + index,
  );

  const yearlyStats = await Promise.all(
    years.map((year) => getGitHubProfileStatsForYear(username, year, token)),
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
  user: GitHubUser;
  stats: GitHubUserStats;
}> {
  const user = await getGitHubUser(username, env);
  const stats = await getGitHubProfileStats(username, user.created_at, env);

  return {
    user,
    stats,
  };
}
