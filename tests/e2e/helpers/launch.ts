import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Page } from '@playwright/test';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..', '..', '..');

const CONTENT_SCRIPT = path.resolve(repoRoot, 'dist', 'content', 'index.js');

// The crlf module only activates on www.linkedin.com, so the fixture is served
// at that origin via request interception. This stays fully offline: Playwright
// fulfills the response from a local file and never touches the network.
const LINKEDIN_URL = 'https://www.linkedin.com/';
const LINKEDIN_ROUTE = /^https:\/\/www\.linkedin\.com\//;

// Minimal stand-in for the WebExtension `browser` API. The content script only
// reads storage.sync at bootstrap; an empty map means every module is enabled,
// matching a fresh install.
const BROWSER_STUB = `globalThis.browser = { storage: { sync: { get: async () => ({}) } } };`;

function fixturePath(name: string): string {
  return path.resolve(here, '..', 'fixtures', name);
}

async function serveFixture(page: Page, name: string): Promise<void> {
  await page.route(LINKEDIN_ROUTE, (route) =>
    route.fulfill({ contentType: 'text/html; charset=utf-8', path: fixturePath(name) }),
  );
}

export async function openWithExtension(page: Page, name: string): Promise<void> {
  await page.addInitScript(BROWSER_STUB);
  await serveFixture(page, name);
  await page.goto(LINKEDIN_URL);
  await page.addScriptTag({ path: CONTENT_SCRIPT });
  // bootstrap() installs its capture listener after one async storage read;
  // yield a macrotask so the listener is attached before the test acts.
  await page.evaluate(() => new Promise<void>((resolve) => setTimeout(resolve, 0)));
}

export async function openWithoutExtension(page: Page, name: string): Promise<void> {
  await serveFixture(page, name);
  await page.goto(LINKEDIN_URL);
}
