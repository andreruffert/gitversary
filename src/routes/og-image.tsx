import { Temporal } from '@js-temporal/polyfill';
import { Hono } from 'hono';
import { getGitHubAge } from '../lib/github-age';
import { getMilestoneData } from '../lib/milestones';
import { findProfile } from '../lib/profiles';
import { formatJoinedDate } from '../lib/utils';
import { OgImageDefault } from '../pages/og-image-default';
import { OgImageProfile } from '../pages/og-image-profile';
import { rendererOgImage } from '../renderer';
import type { Bindings } from '../types';

export const ogImage = new Hono<{ Bindings: Bindings }>();

ogImage.use(rendererOgImage);

ogImage.use('*', async (c, next) => {
  c.header('X-Robots-Tag', 'noindex');
  await next();
});

ogImage.get('/', async (c) => {
  const renderFlag = c.req.query('render');

  if (renderFlag === '1') {
    return c.render(<OgImageDefault />);
  }

  const image = await c.env.IMAGES.get('og/default.webp');

  if (!image) {
    return c.notFound();
  }

  return new Response(image.body, {
    headers: {
      'Content-Type': image.httpMetadata.contentType,
      'Cache-Control': 'public, max-age=31536000, immutable',
      ETag: image.httpEtag,
    },
  });
});

ogImage.get('/:username', async (c) => {
  const renderFlag = c.req.query('render');
  const username = c.req.param('username');
  const profile = await findProfile(c.env.DB, username);

  if (!profile) {
    return c.notFound();
  }

  if (renderFlag === '1') {
    // `years` is derived fresh here rather than read from
    // `profile.imageYears`, because that DB column isn't updated until
    // *after* this render succeeds (see setProfileImage in jobs/gitversary-image.ts)
    const age = getGitHubAge(profile.githubCreatedAt, Temporal.Now.plainDateISO('UTC'));

    const milestone = getMilestoneData({ username: profile.username, years: age.years });

    return c.render(
      <OgImageProfile
        username={username}
        avatarUrl={profile.avatarUrl}
        years={age.years}
        status={milestone.status}
      />,
      {
        headerMeta: `Joined ${formatJoinedDate(profile.githubCreatedAt)}`,
      },
    );
  }

  // A freshly created profile has no image yet (its screenshot job may
  // still be queued/in flight) — imageKey is null until that completes.
  // R2Bucket.get(null) isn't a supported call, so this would otherwise
  // throw a 500 instead of a clean 404.
  if (!profile.imageKey) {
    return c.notFound();
  }

  const image = await c.env.IMAGES.get(profile.imageKey);

  if (!image) {
    return c.notFound();
  }

  return new Response(image.body, {
    headers: {
      'Content-Type': image.httpMetadata.contentType,
      'Cache-Control': image.httpMetadata.cacheControl,
      ETag: image.httpEtag,
    },
  });
});
