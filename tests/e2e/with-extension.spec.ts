import { test, expect } from '@playwright/test';
import { openWithExtension } from './helpers/launch.js';

test.describe('crlf fix (with extension)', () => {
  test('Enter inserts a line break and preempts LinkedIn interference', async ({ page }) => {
    await openWithExtension(page, 'composer.html');

    const editor = page.locator('#composer');
    await editor.click();
    await page.keyboard.type('a');
    const before = await editor.evaluate((el) => el.querySelectorAll('br').length);

    await page.keyboard.press('Enter');

    // The capture-phase fix stops the keystroke reaching LinkedIn's handler.
    await expect(page.locator('#interference-marker')).toHaveText('');
    // And it inserts a <br>, so the composer is genuinely multi-line.
    const after = await editor.evaluate((el) => el.querySelectorAll('br').length);
    expect(after).toBeGreaterThan(before);
    await expect(editor).toContainText('a');
  });

  test('Shift+Enter also inserts a line break', async ({ page }) => {
    await openWithExtension(page, 'composer.html');

    const editor = page.locator('#composer');
    await editor.click();
    await page.keyboard.type('a');
    const before = await editor.evaluate((el) => el.querySelectorAll('br').length);

    await page.keyboard.press('Shift+Enter');

    await expect(page.locator('#interference-marker')).toHaveText('');
    const after = await editor.evaluate((el) => el.querySelectorAll('br').length);
    expect(after).toBeGreaterThan(before);
  });
});
