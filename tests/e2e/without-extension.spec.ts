import { test, expect } from '@playwright/test';
import { openWithoutExtension } from './helpers/launch.js';

// Regression canary. With no extension loaded, LinkedIn's interfering handler
// (modelled in the fixture) swallows Enter and no line break is inserted. This
// test PASSES while the bug reproduces; if it ever fails, the broken behavior
// is gone and the crlf module can be retired. Never wire live LinkedIn into CI.
test.describe('native behavior (without extension)', () => {
  test('Enter is swallowed and inserts no line break', async ({ page }) => {
    await openWithoutExtension(page, 'composer.html');

    const editor = page.locator('#composer');
    await editor.click();
    await page.keyboard.type('a');
    const before = await editor.evaluate((el) => el.querySelectorAll('br').length);

    await page.keyboard.press('Enter');

    await expect(page.locator('#interference-marker')).toHaveText('interfered');
    const after = await editor.evaluate((el) => el.querySelectorAll('br').length);
    expect(after).toBe(before);
  });
});
