import { Hono } from 'hono';
import { Layout } from '../components/layout';
import { APP_BASE_URL } from '../constants';
import { getProfileCount } from '../lib/profiles';
import { AboutPage } from '../pages/about';
import { HomePage } from '../pages/home';
import { renderer } from '../renderer';
import type { Bindings } from '../types';

export const home = new Hono<{ Bindings: Bindings }>();

// JSX renderer
home.use(renderer);

home.get('/', async (c) => {
  const totalProfiles = await getProfileCount(c.env.DB);

  c.header('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');

  return c.render(
    <Layout>
      <HomePage totalProfiles={totalProfiles} />
    </Layout>,
    {
      url: c.req.url,
      og: {
        image: `${APP_BASE_URL}/og?v=RAmYvVzY`,
      },
    },
  );
});

home.get('/about', (c) => {
  c.header('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');

  return c.render(
    <Layout>
      <AboutPage />
    </Layout>,
    {
      url: c.req.url,
      og: {
        image: `${APP_BASE_URL}/og?v=RAmYvVzY`,
      },
    },
  );
});
