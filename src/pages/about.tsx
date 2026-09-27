export function AboutPage() {
  return (
    <main class="about-page">
      <header class="about-hero">
        <p class="about-kicker">About Gitversary</p>

        <h1>
          Your GitHub <span>anniversary.</span>
        </h1>

        <p class="about-intro">
          Gitversary turns the date you joined GitHub into a small milestone worth celebrating.
        </p>
      </header>

      <div class="about-content">
        <section class="about-section">
          <header class="about-section__header">
            <h2>What is Gitversary?</h2>
          </header>

          <div class="about-section__body">
            <p>Every GitHub account has a beginning.</p>
            <p>
              Gitversary finds yours and turns it into your personal GitHub anniversary. A simple
              way to look back at how long you've been building, experimenting, and shipping.
            </p>
          </div>
        </section>

        <section class="about-section">
          <header class="about-section__header">
            <h2>How it works</h2>
          </header>

          <div class="about-section__body">
            <p>
              Gitversary uses public GitHub account information to find when your account was
              created and calculate your anniversary.
            </p>
          </div>

          <div class="about-stack">
            <span>Cloudflare Workers</span>
            <span>Hono</span>
            <span>SQLite</span>
            <span>GitHub API</span>
            <span>Vite</span>
            <span>HTML</span>
            <span>CSS</span>
            <span>JavaScript</span>
          </div>
        </section>

        <section class="about-section about-section--maker">
          <header class="about-section__header">
            <h2>Made by</h2>
          </header>

          <div class="about-maker">
            <div>
              <p class="about-maker__name">André Ruffert</p>

              <p class="about-maker__copy">
                A small experiment in turning a piece of developer metadata into something worth
                celebrating.
              </p>
            </div>

            <a
              class="about-maker__link"
              href="https://github.com/andreruffert"
              target="_blank"
              rel="noreferrer"
            >
              @andreruffert
              <span aria-hidden="true">↗</span>
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}
