import { BrandMark } from '../components/brand-mark';
import { Icon } from '../components/icons';

export function HomePage({ totalProfiles = 0 } = {}) {
  return (
    <>
      <main class="form-page">
        <div class="form-page__background" aria-hidden="true">
          <div class="form-page__orb" />
          <span class="form-page__dot form-page__dot--one" />
          <span class="form-page__dot form-page__dot--two" />
          <span class="form-page__dot form-page__dot--three" />
        </div>

        <header class="form-page__brand">
          <BrandMark class="form-page__brand-icon" />
          <span>Gitversary</span>
        </header>

        <section class="form-page__hero" aria-labelledby="form-title">
          <div class="form-page__kicker">A little trip down memory lane</div>

          <h1 id="form-title">How long have you been on GitHub?</h1>

          <p class="form-page__description">Enter your username. Let’s find out.</p>
        </section>

        <form class="form-page__form" method="get" action="/generate">
          <div class="form-page__field">
            <label for="username">GitHub username</label>

            <div class="form-page__control">
              <div class="form-page__input">
                <span aria-hidden="true">@</span>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  placeholder="octocat"
                  spellCheck={false}
                  autoCapitalize="none"
                  // biome-ignore lint/a11y/noAutofocus: autofocus is intentional for this form
                  autoFocus
                  required
                />
              </div>

              <button type="submit" class="button button--primary">
                <span>Find my Gitversary</span>
                <Icon name="arrow-right" />
              </button>
            </div>
          </div>

          <p class="form-page__note">
            <span class="form-page__note-check" aria-hidden="true">
              ✓
            </span>
            No sign-in. No GitHub connection. Just your username.
          </p>
        </form>
      </main>

      <aside class="form-page-meta">
        <div class="form-page-meta__stat">
          <span class="form-page-meta__stat-number">{totalProfiles.toLocaleString()}</span>
          <span class="form-page-meta__stat-label">Gitversaries generated.</span>
        </div>
      </aside>
    </>
  );
}
