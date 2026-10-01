import type { GitHubAccount, GitHubAccountType } from './github';

export type Profile = {
  username: string;
  githubId: number;
  githubAccountType: GitHubAccountType;
  githubCreatedAt: string;
  githubUrl: string;
  avatarUrl: string;
  imageKey: string | null;
  imageYears: number | null;
  stats: {
    publicRepos: number;
    followers: number;
    following: number;
    pullRequests: number;
    totalCommits: number;
  };
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
};

function getExpiryDate(now = new Date()): Date {
  const expiresAt = new Date(now);
  expiresAt.setUTCFullYear(expiresAt.getUTCFullYear() + 1);

  return expiresAt;
}

const emptyStats = (): Profile['stats'] => ({
  publicRepos: 0,
  followers: 0,
  following: 0,
  pullRequests: 0,
  totalCommits: 0,
});

function mapRow(row: {
  username: string;
  github_id: number;
  github_account_type: GitHubAccountType;
  avatar_url: string;
  github_url: string;
  github_created_at: string;
  created_at: string;
  updated_at: string;
  expires_at: string | null;
  image_key: string | null;
  image_years: number | null;
  stats_json: string | null;
}): Profile {
  return {
    username: row.username,
    githubId: row.github_id,
    githubAccountType: row.github_account_type,
    avatarUrl: row.avatar_url,
    githubUrl: row.github_url,
    githubCreatedAt: row.github_created_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    expiresAt: row.expires_at!,
    imageKey: row.image_key,
    imageYears: row.image_years,
    stats: row.stats_json
      ? {
          ...emptyStats(),
          ...JSON.parse(row.stats_json),
        }
      : emptyStats(),
  };
}

export async function findProfile(db: D1Database, username: string): Promise<Profile | null> {
  const row = await db
    .prepare(`
      SELECT
        username,
        github_id,
        github_account_type,
        avatar_url,
        github_url,
        github_created_at,
        created_at,
        updated_at,
        expires_at,
        image_key,
        image_years,
        stats_json
      FROM profiles
      WHERE username = ?
    `)
    .bind(username)
    .first<{
      username: string;
      github_id: number;
      github_account_type: GitHubAccountType;
      avatar_url: string;
      github_url: string;
      github_created_at: string;
      created_at: string;
      updated_at: string;
      expires_at: string | null;
      image_key: string | null;
      image_years: number | null;
      stats_json: string | null;
    }>();

  return row ? mapRow(row) : null;
}

export async function saveProfile(
  db: D1Database,
  user: GitHubAccount,
  profileStats: GitHubAccountStats,
  now = new Date(),
): Promise<Profile> {
  const updatedAt = now.toISOString();
  const expiresAt = getExpiryDate(now).toISOString();

  const stats: Profile['stats'] = {
    publicRepos: user.public_repos,
    followers: user.followers,
    following: user.following,
    pullRequests: profileStats.pullRequests,
    totalCommits: profileStats.totalCommits,
  };

  // `created_at` and `image_key`/`image_years` are intentionally left out of the
  // ON CONFLICT SET clause, so a cache-refresh upsert can never overwrite them:
  //  - created_at should only ever be written once, on the initial INSERT.
  //  - image_key/image_years record an already-generated image; wiping them
  //    on every refresh would make generateProfile() think no image
  //    exists yet and force an unnecessary regeneration every cycle.
  // Since the JS side can't otherwise tell whether this call just
  // inserted (fresh values) or hit the conflict branch (existing row's
  // values), RETURNING reads back whichever actually happened.
  const row = await db
    .prepare(`
      INSERT INTO profiles (
        username,
        github_id,
        github_account_type,
        avatar_url,
        github_url,
        github_created_at,
        created_at,
        updated_at,
        expires_at,
        image_key,
        image_years,
        stats_json
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, ?)
      ON CONFLICT(username) DO UPDATE SET
        github_id = excluded.github_id,
        github_account_type = excluded.github_account_type,
        avatar_url = excluded.avatar_url,
        github_url = excluded.github_url,
        github_created_at = excluded.github_created_at,
        updated_at = excluded.updated_at,
        expires_at = excluded.expires_at,
        stats_json = excluded.stats_json
      RETURNING created_at, image_key, image_years
    `)
    .bind(
      user.login,
      user.id,
      user.type,
      user.avatar_url,
      user.html_url,
      user.created_at,
      updatedAt,
      updatedAt,
      expiresAt,
      JSON.stringify(stats),
    )
    .first<{
      created_at: string;
      image_key: string | null;
      image_years: number | null;
    }>();

  if (!row) {
    throw new Error('Failed to save profile');
  }

  return {
    username: user.login,
    githubId: user.id,
    githubAccountType: user.type,
    avatarUrl: user.avatar_url,
    githubUrl: user.html_url,
    githubCreatedAt: user.created_at,
    createdAt: row.created_at,
    updatedAt,
    expiresAt,
    imageKey: row.image_key,
    imageYears: row.image_years,
    stats,
  };
}

export function isExpired(profile: Profile, now = new Date()): boolean {
  return now >= new Date(profile.expiresAt);
}

export async function setProfileImage(
  db: D1Database,
  username: string,
  imageKey: string,
  imageYears: number,
): Promise<void> {
  await db
    .prepare(`
      UPDATE profiles
      SET image_key = ?, image_years = ?
      WHERE username = ?
    `)
    .bind(imageKey, imageYears, username)
    .run();
}

export async function getProfileCount(db: D1Database) {
  const result = await db
    .prepare(`
      SELECT COUNT(*) AS count
      FROM profiles;
    `)
    .first<{ count: number }>();

  return result?.count ?? 0;
}
