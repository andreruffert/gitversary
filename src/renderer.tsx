import { html } from 'hono/html';
import type { PropsWithChildren } from 'hono/jsx';
import { jsxRenderer } from 'hono/jsx-renderer';
import { Link, Script, ViteClient } from 'vite-ssr-components/hono';
import { APP_DISPLAY_NAME, APP_VERSION } from './constants';

const FAVICON_URL = './favicon.svg?v=91FS85pa';

interface RendererProps {
  url: string;
  title?: string;
  description?: string;
  og?: {
    title?: string;
    description?: string;
    image: string;
  };
  scripts?: [string];
}

export const renderer = jsxRenderer(
  ({
    url,
    title = `${APP_DISPLAY_NAME} · A little trip down memory lane`,
    description = "Discover how long you've been on GitHub. Enter your username. Let’s find out.",
    og,
    scripts,
    children,
  }: PropsWithChildren<RendererProps>) => (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="icon" type="image/svg+xml" href={FAVICON_URL} />
        <link rel="canonical" href={url} />

        <meta name="version" content={APP_VERSION} />

        {og && (
          <>
            <meta property="og:type" content="website" />
            <meta property="og:url" content={url} />
            <meta property="og:title" content={og?.title ?? title} />
            <meta property="og:description" content={og?.description ?? description} />
            <meta property="og:image" content={og.image} />
            <meta property="og:image:alt" content={og?.title ?? title} />
          </>
        )}

        {html`
          <script>
            // Ensure the event listener is setup before the initial \`color-scheme-switch\` event gets fired.
            document.addEventListener('color-scheme-switch', (event) => {
              const colorScheme = event.target.value;
              const nextColorScheme = colorScheme === 'light' ? 'dark' : 'light';

              document.documentElement.style.setProperty('color-scheme', colorScheme);
              event.target.setAttribute('aria-label', \`Switch to \${nextColorScheme} color scheme\`);
              event.target.querySelector('svg use').setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', colorScheme === 'light' ? '#icon-sun' : '#icon-moon');
              event.target.querySelector('span').textContent = \`Use \${nextColorScheme} theme\`;
            });
          </script>
          <script type="module" async blocking="render" src="https://cdn.jsdelivr.net/npm/color-scheme-switch-element@2/+esm"></script>
        `}

        <Link href="/src/styles/index.css" rel="stylesheet" />
        <ViteClient />
      </head>
      <body>
        {children}
        <Script src="/src/client/app.js" />
        {scripts?.map((src) => (
          <Script src={src} />
        ))}
      </body>
    </html>
  ),
);

export const rendererOgImage = jsxRenderer(({ headerMeta, children }: PropsWithChildren) => (
  <html lang="en">
    <head>
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=1200, initial-scale=1" />
      <link rel="icon" type="image/svg+xml" href={FAVICON_URL} />
      <meta name="version" content={APP_VERSION} />
      <Link href="/src/styles/og-image.css" rel="stylesheet" />
    </head>
    <body>
      <main class="og-canvas">
        <div class="og-background">
          <div class="og-background__glow og-background__glow--green"></div>
          <div class="og-background__glow og-background__glow--purple"></div>
          <div class="og-background__grid"></div>
        </div>

        <section class="og-card">
          <div class="og-card__glow og-card__glow--green"></div>
          <div class="og-card__glow og-card__glow--purple"></div>

          <header class="og-header">
            <div class="og-brand">
              <svg
                width="24"
                height="24"
                viewBox="0 0 512 512"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                xmlns:xlink="http://www.w3.org/1999/xlink"
                aria-hidden="true"
              >
                <defs>
                  <radialGradient
                    id="paint0_radial_36_2"
                    cx="0"
                    cy="0"
                    r="1"
                    gradientUnits="userSpaceOnUse"
                    gradientTransform="translate(452.5 45.5) rotate(135.494) scale(614.852)"
                  >
                    <stop stop-color="var(--og-green)" stop-opacity="0.5" />
                    <stop offset="0.306396" stop-color="var(--og-green)" stop-opacity="0" />
                    <stop offset="0.734144" stop-color="var(--og-purple)" stop-opacity="0" />
                    <stop offset="1" stop-color="var(--og-purple)" stop-opacity="0.5" />
                  </radialGradient>
                  <pattern
                    id="pattern0_36_2"
                    patternUnits="userSpaceOnUse"
                    patternTransform="matrix(37 0 0 36 237 237.5)"
                    preserveAspectRatio="none"
                    viewBox="-0.5 -0.5 37 36"
                    width="1"
                    height="1"
                  >
                    <use xlink:href="#pattern0_36_2_inner" transform="translate(-37 -36)" />
                    <use xlink:href="#pattern0_36_2_inner" transform="translate(0 -36)" />
                    <use xlink:href="#pattern0_36_2_inner" transform="translate(-37 0)" />
                    <g id="pattern0_36_2_inner">
                      <rect
                        width="37"
                        height="36"
                        transform="matrix(-1 0 0 1 37 0)"
                        stroke="var(--og-border)"
                      />
                    </g>
                  </pattern>
                </defs>
                <rect width="512" height="512" rx="120" fill="var(--og-bg)"></rect>
                <rect
                  x="4"
                  y="4"
                  width="504"
                  height="504"
                  rx="116"
                  fill="url(#paint0_radial_36_2)"
                />
                <rect x="4" y="4" width="504" height="504" rx="116" fill="url(#pattern0_36_2)" />
                <rect
                  x="4"
                  y="4"
                  width="504"
                  height="504"
                  rx="116"
                  stroke="var(--og-border)"
                  stroke-width="8"
                />
                <path
                  d="M256 60.95C145.5 60.95 56 150.5 56 260.95C56 349.333 113.3 424.283 192.75 450.7C202.75 452.583 206.417 446.4 206.417 441.083C206.417 436.333 206.25 423.75 206.167 407.083C150.533 419.15 138.8 380.25 138.8 380.25C129.7 357.167 116.55 351 116.55 351C98.4333 338.6 117.95 338.85 117.95 338.85C138.033 340.25 148.583 359.45 148.583 359.45C166.417 390.033 195.4 381.2 206.833 376.083C208.633 363.15 213.783 354.333 219.5 349.333C175.083 344.333 128.4 327.133 128.4 250.5C128.4 228.667 136.15 210.833 148.983 196.833C146.733 191.783 139.983 171.45 150.733 143.9C150.733 143.9 167.483 138.533 205.733 164.4C221.733 159.95 238.733 157.75 255.733 157.65C272.733 157.75 289.733 159.95 305.733 164.4C343.733 138.533 360.483 143.9 360.483 143.9C371.233 171.45 364.483 191.783 362.483 196.833C375.233 210.833 382.983 228.667 382.983 250.5C382.983 327.333 336.233 344.25 291.733 349.167C298.733 355.167 305.233 367.433 305.233 386.167C305.233 412.933 304.983 434.433 304.983 440.933C304.983 446.183 308.483 452.433 318.733 450.433C398.75 424.2 456 349.2 456 260.95C456 150.5 366.45 60.95 256 60.95Z"
                  fill="var(--og-text)"
                />
              </svg>
              <span class="og-brand__name">Gitversary</span>
            </div>
            <div class="og-header__meta">{headerMeta}</div>
          </header>
          {children}
        </section>
      </main>
    </body>
  </html>
));
