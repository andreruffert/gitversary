import { describe, expect, it, vi } from 'vitest';
import { app } from '../src/index';
import type { Bindings } from '../src/types';

function createTestEnv(overrides: Record<string, unknown> = {}): Bindings {
  return {
    DEFAULT_RATE_LIMITER: { limit: vi.fn().mockResolvedValue({ success: true }) },
    ...overrides,
  } as unknown as Bindings;
}

describe('global app behavior', () => {
  it('returns a JSON 404 for unknown routes', async () => {
    // A single path segment (e.g. "/foo") matches profile's `/:username`
    // route instead of falling through to the 404 handler, so this needs
    // multiple segments to genuinely miss every registered route.
    const response = await app.request('/this/route/does-not-exist', {}, createTestEnv());

    expect(response.status).toBe(404);
    expect(response.headers.get('Content-Type')).toContain('application/json');
    expect(await response.json()).toEqual({ error: 'Not found' });
  });

  it('returns 404 without a body for the favicon', async () => {
    const response = await app.request('/favicon.ico', {}, createTestEnv());

    expect(response.status).toBe(404);
  });

  it('sets X-Robots-Tag: noindex on every response', async () => {
    const response = await app.request('/generate', {}, createTestEnv());

    expect(response.headers.get('X-Robots-Tag')).toBe('noindex');
  });

  it('sets a persistent device_id cookie on first visit', async () => {
    const response = await app.request('/generate', {}, createTestEnv());

    const setCookie = response.headers.get('Set-Cookie');

    expect(setCookie).toContain('device_id=');
    expect(setCookie).toContain('HttpOnly');
    expect(setCookie).toContain('Secure');
  });

  it('does not overwrite an existing device_id cookie', async () => {
    const response = await app.request(
      '/generate',
      { headers: { Cookie: 'device_id=existing-device' } },
      createTestEnv(),
    );

    expect(response.headers.get('Set-Cookie')).toBeNull();
  });

  it('rate limits using the device id and connecting IP as the key', async () => {
    const limit = vi.fn().mockResolvedValue({ success: true });
    const env = createTestEnv({ DEFAULT_RATE_LIMITER: { limit } });

    await app.request(
      '/generate',
      { headers: { 'cf-connecting-ip': '203.0.113.5', Cookie: 'device_id=fixed-device' } },
      env,
    );

    expect(limit).toHaveBeenCalledWith({ key: 'rl:fixed-device:203.0.113.5' });
  });

  it('blocks the request with 429 when the rate limiter denies it', async () => {
    const env = createTestEnv({
      DEFAULT_RATE_LIMITER: { limit: vi.fn().mockResolvedValue({ success: false }) },
    });

    const response = await app.request('/generate', {}, env);

    expect(response.status).toBe(429);
    expect(await response.json()).toEqual({ error: 'Too many requests' });
  });
});
