import { Hono } from 'hono';
import { getCookie, setCookie } from 'hono/cookie';
import { handleQueue } from './jobs/queue-handler';
import { home } from './routes/home';
import { ogImage } from './routes/og-image';
import { profile } from './routes/profile';
import type { Bindings } from './types';

export const app = new Hono<{ Bindings: Bindings }>();

// CPU time profiling
if (!import.meta.env.PROD) {
  app.use('*', async (c, next) => {
    const start = performance.now();
    await next();
    const elapsed = performance.now() - start;

    console.debug(
      `[request-time] ${c.req.method} ${c.req.path} → ${elapsed.toFixed(2)}ms (${c.res.status})`,
    );
  });
}

// Global headers for every response
app.use('*', async (c, next) => {
  c.header('X-Robots-Tag', 'noindex');
  await next();
});

// Basic rate limiting
app.use('*', async (c, next) => {
  let deviceId = getCookie(c, 'device_id');

  if (!deviceId) {
    deviceId = crypto.randomUUID();
    setCookie(c, 'device_id', deviceId, {
      httpOnly: true,
      secure: true,
      sameSite: 'Lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
    });
  }

  const ip = c.req.header('cf-connecting-ip') ?? 'unknown';
  const key = `rl:${deviceId}:${ip}`;
  const { success } = await c.env.DEFAULT_RATE_LIMITER.limit({ key });

  if (!success) {
    return c.json({ error: 'Too many requests' }, 429);
  }

  await next();
});

app.get('/favicon.ico', (c) => c.body(null, 404));
app.route('/og', ogImage);
app.route('/', home);
app.route('/', profile);

app.notFound((c) => {
  return c.json(
    {
      error: 'Not found',
    },
    404,
  );
});

export default {
  fetch: app.fetch,
  queue: handleQueue,
};
