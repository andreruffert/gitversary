import { importPKCS8, SignJWT } from 'jose';
import type { Bindings } from '../types';

const GITHUB_API = 'https://api.github.com';

type InstallationTokenResponse = {
  token: string;
  expires_at: string;
};

type CachedToken = {
  token: string;
  expiresAt: number;
};

let cachedToken: CachedToken | null = null;

async function createAppJwt(appId: string, privateKey: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const key = await importPKCS8(privateKey, 'RS256');

  return new SignJWT({})
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
    .setIssuedAt(now - 60)
    .setExpirationTime(now + 9 * 60)
    .setIssuer(appId)
    .sign(key);
}

async function createInstallationToken(env: Bindings): Promise<CachedToken> {
  const jwt = await createAppJwt(env.GITHUB_APP_ID, env.GITHUB_APP_PRIVATE_KEY);
  const response = await fetch(
    `${GITHUB_API}/app/installations/${env.GITHUB_APP_INSTALLATION_ID}/access_tokens`,
    {
      method: 'POST',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${jwt}`,
        'X-GitHub-Api-Version': '2026-03-10',
        'User-Agent': 'gitversary-app',
      },
    },
  );

  if (!response.ok) {
    const body = await response.text();

    console.error('GitHub installation token error:', {
      status: response.status,
      body,
    });

    throw new Error(`Failed to create GitHub installation token: ${response.status}`);
  }

  const data = (await response.json()) as InstallationTokenResponse;

  return {
    token: data.token,
    expiresAt: new Date(data.expires_at).getTime(),
  };
}

export async function getGitHubInstallationToken(env: Bindings): Promise<string> {
  const now = Date.now();

  // Keep a safety margin so we never use a token that's about to expire.
  if (cachedToken && cachedToken.expiresAt > now + 60_000) {
    return cachedToken.token;
  }

  cachedToken = await createInstallationToken(env);

  return cachedToken.token;
}
