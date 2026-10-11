import { Hono } from 'hono';
import { getCookie, setCookie } from 'hono/cookie';
import { secureHeaders } from 'hono/secure-headers';
import { Layout } from './components/layout';
import { APP_BASE_URL } from './constants';
import { handleQueue } from './jobs/queue-handler';
import { NotFoundPage } from './pages/not-found';
import { home } from './routes/home';
import { ogImage } from './routes/og-image';
import { profile } from './routes/profile';
import type { Bindings } from './types';

export const app = new Hono<{ Bindings: Bindings }>();

// Apply security headers to all responses, including rendered pages and errors.
app.use(
  '*',
  secureHeaders({
    xFrameOptions: 'DENY',
    referrerPolicy: 'strict-origin-when-cross-origin',
  }),
);

// CPU time profiling (development only).
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

// Rate-limit application traffic by device and IP.
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

// Application routes.
app.route('/og', ogImage);
app.route('/', home);
app.route('/', profile);

// Render a consistent, non-indexable 404 page.
app.notFound((c) => {
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
        image: `${APP_BASE_URL}/og?v=RAmYvVzY`,
      },
    },
  );
});

export default {
  fetch: app.fetch,
  queue: handleQueue,
};
