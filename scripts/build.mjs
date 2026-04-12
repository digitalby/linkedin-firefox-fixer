import { build } from 'esbuild';
import { mkdir, writeFile, cp, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const SRC = resolve(ROOT, 'src');
const DIST = resolve(ROOT, 'dist');

const MANIFEST = {
  manifest_version: 3,
  name: 'LinkedIn Firefox Fixer',
  short_name: 'LI Fixer',
  version: '0.0.1',
  description:
    'Fixes broken text editing and other interactions on LinkedIn when using Firefox.',
  browser_specific_settings: {
    gecko: {
      id: 'linkedin-firefox-fixer@digitalby.me',
      strict_min_version: '128.0',
    },
  },
  permissions: ['storage'],
  host_permissions: ['https://www.linkedin.com/*'],
  background: {
    scripts: ['background/index.js'],
  },
  content_scripts: [
    {
      matches: ['https://www.linkedin.com/*'],
      js: ['content/index.js'],
      run_at: 'document_idle',
      all_frames: false,
    },
  ],
  options_ui: {
    page: 'options/index.html',
    open_in_tab: false,
  },
};

async function main() {
  if (existsSync(DIST)) {
    await rm(DIST, { recursive: true });
  }
  await mkdir(DIST, { recursive: true });

  await build({
    entryPoints: {
      'content/index': resolve(SRC, 'content/index.ts'),
      'background/index': resolve(SRC, 'background/index.ts'),
      'options/index': resolve(SRC, 'options/index.ts'),
    },
    bundle: true,
    format: 'iife',
    target: ['firefox128'],
    outdir: DIST,
    sourcemap: true,
    logLevel: 'info',
    legalComments: 'none',
  });

  await mkdir(resolve(DIST, 'options'), { recursive: true });
  await cp(resolve(SRC, 'options/index.html'), resolve(DIST, 'options/index.html'));

  await writeFile(
    resolve(DIST, 'manifest.json'),
    JSON.stringify(MANIFEST, null, 2) + '\n',
    'utf8',
  );

  console.log('build: wrote dist/');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
