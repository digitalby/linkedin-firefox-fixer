import { test, expect } from '@playwright/test';
import { launchHarness, LINKEDIN_FIXTURE_URL } from './helpers/launch.js';

test.describe('regression canary: composer without extension', () => {
  test('Shift+Enter in the DM composer produces broken line breaks on native Firefox', async () => {
    const { page, cleanup } = await launchHarness({
      withExtension: false,
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
      const innerHtml = await editor.evaluate((el) => el.innerHTML);

      // The point of this canary is to document what "broken" looks like on
      // native Firefox for the current LinkedIn-shaped fixture. We assert a
      // loose invariant: without the extension, the line break is either
      // absent from innerText or produced as a structural node (not a plain
      // LF). If this ever flips to a clean "first\nsecond", Firefox/LinkedIn
      // fixed the underlying bug and the fix module can retire.
      const hasCleanLineFeed = innerText === 'first\nsecond';
      const hasStructuralBreak = /<br\s*\/?>|<div>|<p>/i.test(innerHtml);

      expect(hasStructuralBreak || !hasCleanLineFeed).toBe(true);
    } finally {
      await cleanup();
    }
  });
});
