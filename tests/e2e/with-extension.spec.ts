import { test, expect } from '@playwright/test';
import { launchHarness, LINKEDIN_FIXTURE_URL } from './helpers/launch.js';

test.describe('fix-crlf: composer with extension', () => {
  test('Shift+Enter produces a real line break in the DM composer', async () => {
    const { page, cleanup } = await launchHarness({
      withExtension: true,
      fixture: 'composer.html',
    });
    try {
      await page.goto(LINKEDIN_FIXTURE_URL);
      const editor = page.locator('.msg-form__contenteditable');
      await editor.click();
      await editor.focus();

      await page.keyboard.type('first');
      await page.keyboard.down('Shift');
      await page.keyboard.press('Enter');
      await page.keyboard.up('Shift');
      await page.keyboard.type('second');

      const innerText = await editor.evaluate((el) => (el as HTMLElement).innerText);
      expect(innerText).toBe('first\nsecond');

      const brCount = await editor.evaluate((el) => el.querySelectorAll('br').length);
      expect(brCount).toBeGreaterThanOrEqual(1);
    } finally {
      await cleanup();
    }
  });

  test('bare Enter in the DM composer triggers submit without inserting a break', async () => {
    const { page, cleanup } = await launchHarness({
      withExtension: true,
      fixture: 'composer.html',
    });
    try {
      await page.goto(LINKEDIN_FIXTURE_URL);
      const editor = page.locator('.msg-form__contenteditable');
      await editor.click();
      await editor.focus();

      await page.keyboard.type('ready to send');
      await page.keyboard.press('Enter');

      const submitted = await page.evaluate(
        () => (window as unknown as { __fixtureSubmitted?: string }).__fixtureSubmitted,
      );
      expect(submitted).toBe('ready to send');
    } finally {
      await cleanup();
    }
  });
});
