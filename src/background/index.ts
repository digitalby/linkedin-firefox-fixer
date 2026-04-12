export {};

const STORAGE_KEY = 'enabledModules';
const DEFAULTS: Record<string, boolean> = {
  'fix-crlf': true,
};

async function seedDefaults(): Promise<void> {
  const current = await browser.storage.sync.get(STORAGE_KEY);
  if (current[STORAGE_KEY] === undefined) {
    await browser.storage.sync.set({ [STORAGE_KEY]: DEFAULTS });
  }
}

browser.runtime.onInstalled.addListener(() => {
  void seedDefaults();
});
