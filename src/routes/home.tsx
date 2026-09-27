import { Hono } from 'hono';
import { Layout } from '../components/layout';
import { getProfileCount } from '../lib/profiles';
import { AboutPage } from '../pages/about';
import { HomePage } from '../pages/home';
import { renderer } from '../renderer';
import type { Bindings } from '../types';

export const home = new Hono<{ Bindings: Bindings }>();

home.use(renderer);

home.get('/', async (c) => {
  const origin = new URL(c.req.url).origin;
  const totalProfiles = await getProfileCount(c.env.DB);

  c.header('Cache-Control', 'public, max-age=300, stale-while-revalidate=3600');

  return c.render(
    <Layout>
      <HomePage totalProfiles={totalProfiles} />
    </Layout>,
    {
      url: c.req.url,
      og: {
        image: `${origin}/og?v=RAmYvVzY`,
      },
    },
  );
});

home.get('/about', (c) => {
  const origin = new URL(c.req.url).origin;

  c.header('Cache-Control', 'public, max-age=300, stale-while-revalidate=3600');

  return c.render(
    <Layout>
      <AboutPage />
    </Layout>,
    {
      url: c.req.url,
      og: {
        image: `${origin}/og?v=RAmYvVzY`,
      },
    },
  );
});
