import { APP_BASE_URL } from '../constants';
import { setProfileImage } from '../lib/profiles';
import type { Bindings } from '../types';

type GitversaryImageJob = {
  id: string;
  createdAt: string;
  data: {
    username: string;
    years: number;
  };
};

export async function processGitversaryImage(job: GitversaryImageJob, env: Bindings) {
  const screenshot = await env.BROWSER.quickAction('screenshot', {
    url: `${APP_BASE_URL}/og/${job.data.username}?render=1`,
    viewport: {
      width: 1200,
      height: 630,
    },
    selector: '.og-canvas',
    screenshotOptions: {
      type: 'webp',
    },
    gotoOptions: {
      waitUntil: 'networkidle0',
      timeout: 45_000,
    },
  });

  if (!screenshot.ok || !screenshot.body) {
    const error = await screenshot.text().catch(() => '');

    console.error({
      error: 'Screenshot failed',
      details: error,
    });

    throw new Error('Screenshot failed', { cause: error });
  }

  const image = await screenshot.arrayBuffer();
  const key = `og/${job.data.username}/${crypto.randomUUID()}.webp`;

  // Store the screenshot in R2.
  await env.IMAGES.put(key, image, {
    httpMetadata: {
      contentType: 'image/webp',
      cacheControl: 'public, max-age=86400, stale-while-revalidate=604800',
    },
  });

  await setProfileImage(env.DB, job.data.username, key, job.data.years);
}
