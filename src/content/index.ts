import type { FixDisposable, FixModule } from '../types/module.js';
import { crlfFix } from './fixes/crlf.js';

const MODULES: readonly FixModule[] = [crlfFix];
const STORAGE_KEY = 'enabledModules';

interface EnabledMap {
  [id: string]: boolean;
}

function isEnabledMap(value: unknown): value is EnabledMap {
  if (typeof value !== 'object' || value === null) return false;
  for (const v of Object.values(value)) {
    if (typeof v !== 'boolean') return false;
  }
  return true;
}

async function loadEnabled(): Promise<EnabledMap> {
  const result = (await browser.storage.sync.get(STORAGE_KEY)) as Record<string, unknown>;
  const value = result[STORAGE_KEY];
  return isEnabledMap(value) ? value : {};
}

async function bootstrap(): Promise<void> {
  const url = new URL(window.location.href);
  const enabled = await loadEnabled();
  const disposables: FixDisposable[] = [];

  for (const mod of MODULES) {
    if (enabled[mod.id] === false) continue;
    if (!mod.matches(url)) continue;
    disposables.push(mod.install(document));
  }

  window.addEventListener('pagehide', () => {
    for (const d of disposables) d.dispose();
  });
}

void bootstrap();
