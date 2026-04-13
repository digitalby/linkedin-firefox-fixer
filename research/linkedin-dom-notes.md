# LinkedIn DOM Notes (2026-04)

These are hypothesized selectors and event wiring based on public documentation and third-party integration code (Briskine, Gorgias). They must be **verified against live LinkedIn** during `feature/fix-crlf` development before hard-coding into any fix module — LinkedIn rotates class names and occasionally restructures surfaces.

## Surfaces

### DM message composer (inline, inside a conversation thread)
- Container: `div.msg-form__container`
- Editor: `div.msg-form__contenteditable[role="textbox"][contenteditable="true"]`
- Library: Quill (class `ql-editor` may or may not appear depending on LinkedIn version)
- Submit: form `<button class="msg-form__send-button">`
- Enter behavior (current): bare Enter triggers submit via a `keydown` handler on the form wrapper. Shift+Enter is supposed to insert a line break.

### DM standalone window (right-rail pop-up)
- Same editor classes, different wrapping chrome. Selector in `matches()` must not depend on the surrounding modal.

### Post composer (share box)
- Container: `div.share-creation-state`
- Editor: `div.ql-editor[contenteditable="true"]` inside a `.share-box` modal
- Enter inserts a newline; submit is a separate Post button. Different semantics than the DM composer.

### Comment composer
- `div.comments-comment-box__editor[contenteditable="true"]`
- Enter submits; Shift+Enter inserts a newline. Same semantics as DM.

### Repost composer
- Similar to post composer but wrapped in a reshare modal.

## Submit-on-bare-Enter matrix

| Surface | Bare Enter | Shift+Enter | Ctrl/Cmd+Enter |
|---|---|---|---|
| DM composer | submit | newline | submit |
| Comment | submit | newline | submit |
| Post composer | newline | newline | submit |
| Repost | newline | newline | submit |

The `classifyEnter` helper in `src/content/lib/keys.ts` takes a `submitOnBareEnter` flag; the fix-crlf module should pass `true` for DM and comment surfaces and `false` for post/repost. Surface detection is done by walking up from the target element to a wrapping container whose class identifies the surface type.

## Selectors to probe during development

```js
document.querySelectorAll('[contenteditable="true"][role="textbox"]')
document.querySelectorAll('.ql-editor')
document.querySelectorAll('.msg-form__contenteditable')
document.querySelectorAll('.comments-comment-box__editor')
document.querySelectorAll('.share-creation-state .ql-editor')
```

Record the full class list of each match into this file during Phase 1 of `feature/fix-crlf`. Fixture HTML files under `tests/e2e/fixtures/` should mirror the exact class lists and event wiring observed, so E2E tests stay aligned with reality.

## Event wiring observations to verify

- LinkedIn's Quill handler is registered on the editor element itself (bubble phase). Our capture-phase listener on `document` + `stopPropagation()` preempts it cleanly — but only if LinkedIn hasn't also registered on `document` in capture. Verify during development.
- `beforeinput` events may or may not fire; Quill's own input binding listens to `input` + polled selection. Our synthetic `InputEvent('input', { inputType: 'insertLineBreak' })` after range mutation keeps Quill's internal delta in sync. Confirm by inspecting the serialized post/message body after sending a test message.
- LinkedIn's sanitizer may strip `<br>` in favor of wrapping `<p>` or `<div>`. If serialization drops our inserted breaks, switch strategy: insert `\n` text nodes in plaintext surfaces or construct `<p>` wrappers in block surfaces. Do not guess — measure with real wire payloads via Firefox devtools Network tab.

## CSP / extension constraints

- LinkedIn uses a strict CSP that blocks inline scripts. Content scripts loaded via the extension manifest are exempt. Do not attempt to inject `<script>` into the page — everything must live in the content script.
- LinkedIn loads over HTTPS only. Manifest `host_permissions` is scoped to `https://www.linkedin.com/*`. `www.linkedin.com/m/*` (mobile web) is a separate host — add a second match if mobile-web support is in scope.
- No elevated permissions (`tabs`, `scripting`) are needed for the DOM patches. Only `storage` for module toggles.

## Selectors that must NOT be used

- Anything positional like `div > div > div:nth-child(3)`. LinkedIn reorders trivially.
- Single-class selectors that LinkedIn rotates (e.g. hashed class names). Always anchor on role/contenteditable attributes first and use classes only as supplementary matches.
