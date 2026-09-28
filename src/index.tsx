import { Hono } from 'hono';
import { getCookie, setCookie } from 'hono/cookie';
import { Layout } from './components/layout';
import { APP_BASE_URL } from './constants';
import { handleQueue } from './jobs/queue-handler';
import { NotFoundPage } from './pages/not-found';
import { renderer } from './renderer';
import { home } from './routes/home';
import { ogImage } from './routes/og-image';
import { profile } from './routes/profile';
import type { Bindings } from './types';

export const app = new Hono<{ Bindings: Bindings }>();

// JSX renderer
app.use(renderer);

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

app.get('/robots.txt', (c) => {
  return c.text(`User-Agent: *
Allow: /
Disallow: /assets/

Host: ${APP_BASE_URL}`);
});

app.get('/llms.txt', (c) => {
  return c.text(`# Gitversary

> Discover how long you've been on GitHub.

Gitversary is a web tool for finding a user's GitHub anniversary by entering their GitHub username.

## Features

- Look up a GitHub user's Gitversary
- No sign-in required
- No GitHub connection required
- Username-based lookup

## Pages

- [Home](${APP_BASE_URL})
- [About](${APP_BASE_URL}/about)`);
});

app.route('/og', ogImage);
app.route('/', home);
app.route('/', profile);

app.notFound((c) => {
  const origin = new URL(c.req.url).origin;

  c.header('X-Robots-Tag', 'noindex');
  c.status(404);

  return c.render(
    <Layout>
      <NotFoundPage />
    </Layout>,
    {
      url: c.req.url,
      title: 'Page not found · Gitversary',
      og: {
        image: `${origin}/og?v=RAmYvVzY`,
      },
    },
  );
});

export default {
  fetch: app.fetch,
  queue: handleQueue,
};
