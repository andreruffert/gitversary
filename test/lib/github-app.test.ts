import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Bindings } from '../../src/types';

// The `jose` JWT signing library needs a real PKCS8 key to do anything
// useful; we don't care about real signatures here, just that a bearer
// token gets attached to the outgoing request, so we stub the whole
// builder chain instead of generating test key material.
vi.mock('jose', () => {
  class FakeSignJWT {
    constructor(_payload: unknown) {}
    setProtectedHeader() {
      return this;
    }
    setIssuedAt() {
      return this;
    }
    setExpirationTime() {
      return this;
    }
    setIssuer() {
      return this;
    }
    sign() {
      return Promise.resolve('fake-jwt');
    }
  }

  return {
    importPKCS8: vi.fn().mockResolvedValue('fake-key'),
    SignJWT: FakeSignJWT,
  };
});

function createEnv(overrides: Record<string, unknown> = {}): Bindings {
  return {
    GITHUB_APP_ID: 'app-id',
    GITHUB_APP_PRIVATE_KEY: 'fake-private-key',
    GITHUB_APP_INSTALLATION_ID: 'installation-id',
    ...overrides,
  } as unknown as Bindings;
}

// The module keeps its token cache in a module-level variable, so each
// test needs a fresh module instance to avoid bleeding state between cases.
async function loadModule() {
  vi.resetModules();
  return import('../../src/lib/github-app');
}

describe('getGitHubInstallationToken', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches a fresh token when nothing is cached', async () => {
    const { getGitHubInstallationToken } = await loadModule();

    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          new Response(
            JSON.stringify({ token: 'installation-token', expires_at: '2026-01-01T01:00:00Z' }),
            { status: 200 },
          ),
        ),
    );

    const token = await getGitHubInstallationToken(createEnv());

    expect(token).toBe('installation-token');
    expect(fetch).toHaveBeenCalledOnce();
    expect(fetch).toHaveBeenCalledWith(
      'https://api.github.com/app/installations/installation-id/access_tokens',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer fake-jwt' }),
      }),
    );
  });

  it('reuses a cached token that is not close to expiring', async () => {
    const { getGitHubInstallationToken } = await loadModule();

    const farFuture = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ token: 'first-token', expires_at: farFuture }), {
        status: 200,
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const first = await getGitHubInstallationToken(createEnv());
    const second = await getGitHubInstallationToken(createEnv());

    expect(first).toBe('first-token');
    expect(second).toBe('first-token');
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('refreshes a token that is within the 60s safety margin of expiring', async () => {
    const { getGitHubInstallationToken } = await loadModule();

    const almostExpired = new Date(Date.now() + 30_000).toISOString();
    const stillFresh = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ token: 'stale-token', expires_at: almostExpired }), {
          status: 200,
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ token: 'refreshed-token', expires_at: stillFresh }), {
          status: 200,
        }),
      );
    vi.stubGlobal('fetch', fetchMock);

    const first = await getGitHubInstallationToken(createEnv());
    const second = await getGitHubInstallationToken(createEnv());

    expect(first).toBe('stale-token');
    expect(second).toBe('refreshed-token');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('throws when GitHub rejects the installation token request', async () => {
    const { getGitHubInstallationToken } = await loadModule();

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('unauthorized', { status: 401 })),
    );

    await expect(getGitHubInstallationToken(createEnv())).rejects.toThrow(
      'Failed to create GitHub installation token: 401',
    );
  });
});
