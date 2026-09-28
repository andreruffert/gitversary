import { BrandMark } from '../components/brand-mark';
import { Icon } from '../components/icons';
import { APP_BASE_URL } from '../constants';
import { getMilestoneData } from '../lib/milestones';
import type { Profile } from '../lib/profiles';
import { formatJoinedDate, formatNumber } from '../lib/utils';

interface ProfilePageProps {
  profile: Profile;
  years: number;
  bskyShareUrl: string;
}

export function ProfilePage({ profile, years, bskyShareUrl }: ProfilePageProps) {
  const milestone = getMilestoneData({ username: profile.username, years });

  return (
    <main class="page">
      <div class="hero">
        <div class="hero__celebration" aria-hidden="true">
          <span class="hero__spark">✦</span>
          <span class="hero__spark">✧</span>
          <span class="hero__spark">+</span>
          <span class="hero__spark">✦</span>
          <span class="hero__spark">·</span>
          <span class="hero__spark">+</span>
          <span class="hero__spark">·</span>
          <span class="hero__spark">✧</span>
        </div>

        <article class="hero-card">
          <p class="hero-card__watermark" aria-hidden="true">
            {years}
          </p>

          <header class="hero-card__topbar">
            <div class="brand">
              <BrandMark class="brand__mark" />
              <span>Gitversary</span>
            </div>

            <time class="header-meta" dateTime={profile.githubCreatedAt}>
              Joined {formatJoinedDate(profile.githubCreatedAt)}
            </time>
          </header>

          <div class="hero-content">
            <p class="hero-content__eyebrow">{milestone?.status}</p>

            <div class="hero-content__avatar">
              <img
                src={profile.avatarUrl}
                alt={`GitHub avatar for @${profile.username}`}
                width="106"
                height="106"
                decoding="async"
              />
            </div>

            <p class="hero-content__username">@{profile.username}</p>

            <h1 class="hero-content__anniversary">{years}</h1>

            <p class="hero-content__years">
              <strong>years</strong> on GitHub
            </p>

            <div class="hero-content__divider" aria-hidden="true" />

            <div class="hero-content__badge">
              <Icon name="badge-check" />

              <span>{milestone?.badge}</span>
            </div>

            <h2 class="hero-content__title">{milestone?.title}</h2>

            <p class="hero-content__quote">{milestone?.saying}</p>
          </div>

          <footer class="hero-card__footer">
            <span>Commit history</span>
            <span aria-hidden="true">·</span>
            <strong>{milestone?.tier}</strong>
          </footer>
        </article>
      </div>

      <div class="details">
        <section class="story" aria-labelledby="story-heading">
          <div class="section-header">
            <p class="section-kicker">The story</p>

            <h2 id="story-heading" class="section-heading">
              {years} years of building
            </h2>
          </div>

          <p class="story-copy">{milestone?.summary}</p>
        </section>

        <section class="stats-section" aria-labelledby="stats-heading">
          <div class="section-header">
            <p class="section-kicker">Activity</p>

            <h2 id="stats-heading" class="section-heading">
              By the numbers
            </h2>
          </div>

          <dl class="stats">
            <div class="stats__item">
              <dd class="stats__value">{formatNumber(profile.stats.publicRepos)}</dd>
              <dt class="stats__label">Public repositories</dt>
            </div>

            <div class="stats__item">
              <dd class="stats__value">{formatNumber(profile.stats.followers)}</dd>
              <dt class="stats__label">Followers</dt>
            </div>

            <div class="stats__item">
              <dd class="stats__value">{formatNumber(profile.stats.totalCommits)}</dd>
              <dt class="stats__label">Commits</dt>
            </div>

            <div class="stats__item">
              <dd class="stats__value">{formatNumber(profile.stats.pullRequests)}</dd>
              <dt class="stats__label">Pull requests</dt>
            </div>
          </dl>

          <aside class="note">
            <span class="note__icon">
              <Icon name="info" size="24" />
            </span>

            <div class="note__content">
              <p class="note__label">Public data</p>

              <p class="note__text">
                Based on public GitHub activity. Updated{' '}
                <time dateTime={profile.updatedAt}>{formatJoinedDate(profile.updatedAt)}</time>.
              </p>
            </div>
          </aside>
        </section>
      </div>

      <nav class="actions" aria-label="Gitversary actions">
        <div class="actions__label">Share this Gitversary</div>

        <div class="actions__list">
          <a
            href={bskyShareUrl}
            class="button button--primary"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Icon name="bluesky" />
            <span>Share</span>
          </a>

          <clipboard-copy
            value={`${APP_BASE_URL}/${profile.username}`}
            tabindex="0"
            role="button"
            class="button"
            data-clipboard-copy="Copied to clipboard."
          >
            <Icon name="link" /> Copy link
          </clipboard-copy>

          <a
            href={profile.githubUrl}
            class="button button--quiet"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Icon name="github" />
            <span>View GitHub profile</span>
          </a>
        </div>
      </nav>
    </main>
  );
}
