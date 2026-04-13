# LinkedIn Firefox Fixer

A Firefox WebExtension that patches broken LinkedIn interactions when browsing from Firefox. The first target is text editing (message composer, post editor): LinkedIn's contenteditable behavior on Firefox produces malformed line breaks, making multi-line DMs and posts effectively unusable.

Each fix lives in `src/content/fixes/` as an isolated, toggleable module.

## Status

Early development. Manifest V3, Firefox 128+.

## Install

- **Manual (unsigned, temporary):** download `web-ext-artifacts/*.xpi` from a GitHub Actions run, then load via `about:debugging` → This Firefox → Load Temporary Add-on.
- **Signed release:** grab the signed `.xpi` attached to the latest GitHub Release, or install from addons.mozilla.org once listed.

## Development

```bash
nvm use                 # Node 22
npm ci
npm run build
npm run lint
npm run typecheck
npm test                # unit
npm run e2e:without     # regression canary on fixture DOM
npm run e2e:with        # fix verified on fixture DOM
npm run start:firefox   # open clean Firefox with the extension loaded
```

Live LinkedIn is used for manual smoke testing only. Automated tests run against local DOM fixtures in `tests/e2e/fixtures/` to avoid account risk and ToS exposure.

## Branches

Gitflow. `main` is always shippable. Releases are prepared on `version/*` branches. Each fix module lives on its own `feature/fix-*` branch.

## License

MIT. See `LICENSE`.
