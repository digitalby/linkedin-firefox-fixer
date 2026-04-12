export {};

interface ModuleMeta {
  readonly id: string;
  readonly title: string;
  readonly description: string;
}

const KNOWN_MODULES: readonly ModuleMeta[] = [
  {
    id: 'fix-crlf',
    title: 'Restore multi-line text editing',
    description:
      'Makes Shift+Enter and Enter behave correctly in LinkedIn message and post composers.',
  },
];

const STORAGE_KEY = 'enabledModules';

function isBoolMap(value: unknown): value is Record<string, boolean> {
  if (typeof value !== 'object' || value === null) return false;
  for (const v of Object.values(value)) {
    if (typeof v !== 'boolean') return false;
  }
  return true;
}

async function getEnabled(): Promise<Record<string, boolean>> {
  const result = (await browser.storage.sync.get(STORAGE_KEY)) as Record<string, unknown>;
  const value = result[STORAGE_KEY];
  return isBoolMap(value) ? value : {};
}

async function setEnabled(id: string, on: boolean): Promise<void> {
  const current = await getEnabled();
  current[id] = on;
  await browser.storage.sync.set({ [STORAGE_KEY]: current });
}

async function render(): Promise<void> {
  const list = document.getElementById('modules');
  if (!list) return;
  const enabled = await getEnabled();

  for (const mod of KNOWN_MODULES) {
    const li = document.createElement('li');
    const label = document.createElement('label');
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = enabled[mod.id] !== false;
    input.addEventListener('change', () => {
      void setEnabled(mod.id, input.checked);
    });

    const text = document.createElement('div');
    const title = document.createElement('div');
    title.className = 'title';
    title.textContent = mod.title;
    const desc = document.createElement('div');
    desc.className = 'desc';
    desc.textContent = mod.description;
    text.appendChild(title);
    text.appendChild(desc);

    label.appendChild(input);
    label.appendChild(text);
    li.appendChild(label);
    list.appendChild(li);
  }
}

void render();
