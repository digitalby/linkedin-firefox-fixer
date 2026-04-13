# CLAUDE.md

Guidance for working in this repo. Read before making changes.

## What this is

A Firefox WebExtension (Manifest V3) that patches broken interactions on LinkedIn when browsing from Firefox. The root problem space: LinkedIn's contenteditable composers (Quill-based) generate malformed DOM on Firefox that breaks line breaks, paste, and multi-line editing. LinkedIn will not fix this.

## Stack and why

| Concern | Tool | Notes |
|---|---|---|
| Language | TypeScript strict | `strict: true`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes` |
| Package manager | npm | versions pinned exactly, no `^`/`~`/`latest` |
| Manifest | MV3 + `browser_specific_settings.gecko` | Firefox 128+. MV3 is stable on Firefox since 115; we target 128 to get full APIs |
| Bundler | esbuild | `format: 'iife'`, `target: 'firefox128'`, one entry per extension surface |
| Extension tooling | `web-ext` (Mozilla) | run, lint, build, sign. Config in `web-ext-config.cjs` |
| Unit tests | Vitest + jsdom | fast, TS-native. For pure logic only |
| E2E tests | Playwright (`firefox`) | local fixture HTML served from `file://`; both with- and without-extension variants |
| Lint | ESLint flat config + typescript-eslint + prettier | `eslint.config.js`; `--max-warnings=0` |
| CI | GitHub Actions | parallel jobs, no auto-retry |

## Repo layout

```
src/
  content/index.ts           # module registry, URL matching, install/uninstall
  content/fixes/<id>.ts      # one file per fix module
  content/lib/keys.ts        # shared key-event helpers
  background/index.ts        # storage defaults on install
  options/index.{html,ts}    # per-module toggle UI
  types/module.ts            # FixModule contract
scripts/build.mjs            # esbuild + manifest emit
tests/unit/                  # vitest
tests/e2e/fixtures/          # offline DOM mirrors of LinkedIn surfaces
tests/e2e/{with,without}-extension.spec.ts
research/                    # complaint research, DOM notes, sources
```

## Module contract

Every fix implements `FixModule` from `src/types/module.ts`:

```ts
interface FixModule {
  readonly id: string;                        // stable, used as storage key
  readonly title: string;
  readonly description: string;
  matches(url: URL): boolean;                  // activation gate
  install(root: Document): FixDisposable;     // returns cleanup
}
```

### Adding a new fix

1. Create `src/content/fixes/<id>.ts`, export a `FixModule`.
2. Register it in the `MODULES` array in `src/content/index.ts`.
3. Add it to `KNOWN_MODULES` in `src/options/index.ts` so it appears in the options page.
4. Seed its default (enabled/disabled) in `DEFAULTS` in `src/background/index.ts`.
5. Add a unit test under `tests/unit/` if there is pure logic to test.
6. Add an E2E fixture under `tests/e2e/fixtures/` and both spec files.

No other wiring is needed. Modules are installed only when enabled in `browser.storage.sync` and when `matches(url)` returns true.

## Testing strategy

### Unit (`npm test`)
Pure-function tests only. `src/content/lib/keys.ts` is the canonical example: classify a KeyboardEvent into an intent. Test the logic, not the DOM.

### E2E (`npm run e2e:with`, `npm run e2e:without`)
- Playwright launches Firefox against static HTML fixtures in `tests/e2e/fixtures/`. No network, no login, no live LinkedIn.
- `without-extension.spec.ts` is the **regression canary**: it asserts the native broken behavior still reproduces on the fixture. If this test ever flips to passing, the upstream bug is fixed and the corresponding module can be retired.
- `with-extension.spec.ts` loads the built `dist/` via Playwright's Firefox `launchPersistentContext` + temporary add-on loading. Asserts the fix produces correct output.
- Both specs share `tests/e2e/helpers/launch.ts`.

### Manual (release gate, not CI)
`npm run start:firefox` launches a clean Firefox profile with the extension loaded and navigates to linkedin.com. Use this for the pre-release smoke test checklist below. **Never wire live LinkedIn into CI.**

## Release checklist (manual)

1. Merge `version/X.Y.Z` into `main`.
2. Tag `vX.Y.Z`.
3. CI builds the unsigned `.xpi`. Download it from the run artifacts.
4. Manual smoke test in a clean Firefox profile against live LinkedIn:
   - Send a multi-line DM (Shift+Enter and Enter).
   - Reply to an inbound DM with multi-line content.
   - Write a multi-paragraph post.
   - Paste rich text into each surface.
5. Sign via `web-ext sign` using AMO credentials (`WEB_EXT_API_KEY`, `WEB_EXT_API_SECRET` repo secrets). First submission to AMO is manual.
6. Attach the signed `.xpi` to the GitHub Release.

## Gotchas

- **MV3 background on Firefox** uses non-persistent event pages. Do not assume background state survives; store everything through `browser.storage.sync`.
- **Content script timing**: `run_at: 'document_idle'` is correct. LinkedIn hydrates client-side and composers appear later; all fix modules must be resilient to late-mounted elements (use event delegation on `document`, not direct `querySelector` at bootstrap).
- **Event capture** is required. LinkedIn's own Quill handlers run on the bubble phase; our `keydown` listener is registered with `capture: true` and calls `stopPropagation()` to preempt them for cases we handle.
- **IME composition**: always check `event.isComposing` and bail. Breaking CJK input in a LinkedIn fixer would be unforgivable.
- **Firefox WebExtension typings**: use `@types/firefox-webext-browser`, not `@types/chrome`. The `browser.*` API is Promise-native on Firefox; do not polyfill.
- **Pinned versions**: if you bump a dep, run the full suite locally before pushing. Do not iterate via remote CI.

## Branches (gitflow)

- `main` — shippable, tagged releases only.
- `version/X.Y.Z` — integration branch for the next release.
- `feature/fix-<id>` — one per fix module, branched off the active `version/*`.

Commits use imperative mood and the format `type: one sentence why` (types: fix, feat, chore, ci, docs, refactor, test).
