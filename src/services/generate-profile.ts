import { Temporal } from '@js-temporal/polyfill';
import { getGitHubProfile } from '../lib/github';
import { getGitHubAge } from '../lib/github-age';
import { findProfile, isExpired, saveProfile } from '../lib/profiles';
import type { Bindings } from '../types';

export async function generateProfile(
  env: Bindings,
  username: string,
  today = Temporal.Now.plainDateISO('UTC'),
) {
  let profile = await findProfile(env.DB, username);
  let profileChanged = false;

  if (!profile || isExpired(profile)) {
    const { user, stats } = await getGitHubProfile(username, env);

    profile = await saveProfile(env.DB, user, stats);
    profileChanged = true;
  }

  const age = getGitHubAge(profile.githubCreatedAt, today);
  const shouldGenerateImage = profile.imageKey === null || profile.imageYears !== age.years;

  if (shouldGenerateImage) {
    const jobId = crypto.randomUUID();

    await env.IMAGE_QUEUE.send({
      id: jobId,
      createdAt: new Date().toISOString(),
      data: {
        username: profile.username,
        years: age.years,
      },
    });
  }

  return {
    source: profileChanged ? 'github' : 'cached',
    profile,
    age,
  };
}
