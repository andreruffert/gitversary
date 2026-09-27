import { Hono } from 'hono';
import { Layout } from '../components/layout';
import { getMilestoneData } from '../lib/milestones';
import { ProfilePage } from '../pages/profile';
import { renderer } from '../renderer';
import { generateProfile } from '../services/generate-profile';
import type { Bindings } from '../types';

export const profile = new Hono<{ Bindings: Bindings }>();

profile.use(renderer);

profile.get('/generate', (c) => {
  const username = c.req.query('username')?.trim();

  if (!username) {
    return c.redirect('/');
  }

  return c.redirect(`/${encodeURIComponent(username)}`);
});

profile.get('/:username', async (c) => {
  const origin = new URL(c.req.url).origin;
  const username = c.req.param('username');

  try {
    const { profile, age } = await generateProfile(c.env, username);
    const milestone = getMilestoneData({ username: profile.username, years: age.years });
    const bskyShareUrl = getBlueskyShareUrl(
      c.req.header('User-Agent') ?? '',
      [
        `🎉 ${age.years} years on GitHub.`,
        '',
        `"${milestone?.saying}"`,
        '',
        '#Gitversary',
        '',
        `${origin}/${encodeURIComponent(profile.username)}`,
      ].join('\n'),
    );

    c.header('Cache-Control', 'public, max-age=300, stale-while-revalidate=3600');

    return c.render(
      <Layout>
        <ProfilePage profile={profile} years={age.years} bskyShareUrl={bskyShareUrl} />
      </Layout>,
      {
        url: c.req.url,
        title: `@${profile.username} - ${age.years} years on GitHub · Gitversary`,
        description: `@${profile.username} has been on GitHub for ${age.years} years. See the Gitversary, stats, and story.`,
        og: {
          title: `@${profile.username} - ${age.years} years on GitHub · Gitversary`,
          description: milestone?.summary,
          image: `${origin}/og/${encodeURIComponent(profile.username)}?v=tZD5m2hR`,
        },
      },
    );
  } catch (error) {
    console.error('Profile generation failed:', error);

    return c.text('Unable to generate this Gitversary.', 500);
  }
});

function getBlueskyShareUrl(userAgent: string, text: string): string {
  const isMobile =
    /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(userAgent) ||
    (/Macintosh/i.test(userAgent) && /Mobile/i.test(userAgent));
  const baseUrl = isMobile ? 'bluesky://intent/compose' : 'https://bsky.app/intent/compose';

  return `${baseUrl}?text=${encodeURIComponent(text)}`;
}
