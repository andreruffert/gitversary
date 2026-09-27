import { execFileSync } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import pkg from '../package.json' with { type: 'json' };

const buildTimestamp = new Date().toISOString();

function getBuildVersion() {
  try {
    const describe = execFileSync('git', ['describe', '--tags', '--long', '--dirty', '--always'], {
      encoding: 'utf8',
    }).trim();

    const match = describe.match(/^v?(.+?)-(\d+)-g([a-f0-9]+)(-dirty)?$/);

    if (!match) {
      return `v${pkg.version}.dev+g${describe}`;
    }

    const [, version, commits, hash, dirty = ''] = match;

    if (commits === '0') {
      return `v${version}${dirty}`;
    }

    return `v${version}.dev${commits}+g${hash}${dirty}`;
  } catch {
    return `v${pkg.version}`;
  }
}

const content = `/**
 * GENERATED CODE - DO NOT MODIFY
 */

export const BUILD_TIMESTAMP = ${JSON.stringify(buildTimestamp)};
export const BUILD_VERSION = ${JSON.stringify(getBuildVersion())};
`;

await writeFile(resolve('src', 'build-info.ts'), content, 'utf8');

console.log('✔ build-info.ts generated');
