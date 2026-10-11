import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import pkg from '../package.json' with { type: 'json' };

const APP_BASE_URL = pkg.config.baseUrl;
const SECURITY_TXT_EXPIRES = '2027-10-11T22:05:12.765Z';
const NOW = new Date();

const files = new Map([
  [
    'sitemap.xml',
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${['/', '/about'].map((path) => `<url><loc>${new URL(path, APP_BASE_URL).href}</loc></url>`).join('\n')}</urlset>`,
  ],
  [
    'robots.txt',
    `User-Agent: *
Content-Signal: ai-train=no, search=yes, ai-input=no
Allow: /
Disallow: /assets/

Sitemap: ${APP_BASE_URL}/sitemap.xml

Host: ${APP_BASE_URL}
`,
  ],
  [
    'llms.txt',
    `# Gitversary

> Discover how long you've been on GitHub.

Gitversary is a web tool for finding a user's GitHub anniversary by entering their GitHub username.

## Features

- Look up a GitHub user's Gitversary
- No sign-in required
- No GitHub connection required
- Username-based lookup

## Pages

- [Home](${APP_BASE_URL})
- [About](${APP_BASE_URL}/about)
`,
  ],
  [
    'humans.txt',
    `/* TEAM */
  Software Engineer: André Ruffert
  Site: andreruffert.com

/* SITE */
Last update: ${NOW.toISOString()}`,
  ],
  [
    '.well-known/security.txt',
    `Contact: https://github.com/andreruffert/gitversary/security/advisories/new
Expires: ${SECURITY_TXT_EXPIRES}
Preferred-Languages: en
`,
  ],
]);

for (const [relativePath, content] of files) {
  const outputPath = join('public', relativePath);

  await mkdir(join(outputPath, '..'), { recursive: true });
  await writeFile(outputPath, content, 'utf8');

  console.log(`✔ ${outputPath} generated`);
}
