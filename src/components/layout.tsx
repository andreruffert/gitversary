import type { PropsWithChildren } from 'hono/jsx';
import { APP_DISPLAY_NAME, APP_VERSION } from '../constants';
import { Icon, Icons } from './icons';

export function Layout({ children }: PropsWithChildren) {
  return (
    <>
      {children}
      <footer class="footer">
        <div class="footer-brand">
          <a href="/">{APP_DISPLAY_NAME}.</a>
          <p>Discover how long you've been on GitHub.</p>
        </div>

        <nav class="footer-links" aria-label="Site-wide links">
          <section>
            <h2>Explore</h2>
            <a href="/">Home</a>
            <a href="/about">About</a>
          </section>
          <section>
            <h2>Site</h2>
            <color-scheme-switch title="Toggle light & dark color scheme" class="button">
              <Icon name="sun" />
              <span>Use dark theme</span>
            </color-scheme-switch>
          </section>
          <section>
            <h2>Elsewhere</h2>
            <a
              href="https://github.com/andreruffert/gitversary"
              target="_blank"
              rel="noopener noreferrer"
            >
              Source on GitHub
            </a>
            <a
              href="https://www.producthunt.com/products/gitversary"
              target="_blank"
              rel="noopener noreferrer"
            >
              Product Hunt
            </a>
          </section>
        </nav>

        <div class="footer-meta">
          <p>{APP_VERSION}</p>
          <p>
            ©{' '}
            <a href="https://andreruffert.com" target="_blank" rel="noopener">
              André Ruffert
            </a>{' '}
            · Have a great day!
          </p>
        </div>
      </footer>
      <Icons />
    </>
  );
}
