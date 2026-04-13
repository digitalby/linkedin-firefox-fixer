import { firefox, type BrowserContext, type Page, type Route } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('../../../', import.meta.url)));
const DIST = join(ROOT, 'dist');
const FIXTURES = join(ROOT, 'tests/e2e/fixtures');

export interface Harness {
  context: BrowserContext;
  page: Page;
  cleanup: () => Promise<void>;
}

interface LaunchOptions {
  readonly withExtension: boolean;
  readonly fixture: string;
}

export async function launchHarness(options: LaunchOptions): Promise<Harness> {
  const profileDir = await mkdtemp(join(tmpdir(), 'lifx-profile-'));
  const context = await firefox.launchPersistentContext(profileDir, { headless: true });

  await context.route('https://www.linkedin.com/**', async (route: Route) => {
    const url = new URL(route.request().url());
    const path = url.pathname.endsWith('.html') ? url.pathname.slice(1) : `${options.fixture}`;
    const file = join(FIXTURES, path);
    const body = await readFile(file, 'utf8');
    await route.fulfill({
      status: 200,
      contentType: 'text/html; charset=utf-8',
      body,
    });
  });

  if (options.withExtension) {
    const contentScript = await readFile(join(DIST, 'content/index.js'), 'utf8');
    await context.addInitScript({
      content: `
        window.browser = window.browser || {
          storage: { sync: { get: async () => ({}), set: async () => {} } },
        };
      `,
    });
    await context.addInitScript({ content: contentScript });
  }

  const page = await context.newPage();
  return {
    context,
    page,
    cleanup: async () => {
      await context.close();
      await rm(profileDir, { recursive: true, force: true });
    },
  };
}

export const LINKEDIN_FIXTURE_URL = 'https://www.linkedin.com/messaging/fixture';
