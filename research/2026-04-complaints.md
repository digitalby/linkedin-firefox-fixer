# LinkedIn on Firefox — Complaint Inventory (2026-04)

Compiled 2026-04-12. Sources in `sources.md`. Ranked roughly by (frequency × severity × fix tractability).

> **Verification gate before shipping any fix:** Firefox bug 1615852 (the padding-`<br>` workaround issue that underlies most contenteditable pain on Firefox) is marked **RESOLVED FIXED** in Firefox 135/145. Before a fix module is merged, the `without-extension` regression canary MUST reproduce the bug on **current** stable Firefox. If the canary can't reproduce, the module retires rather than ships.

## P0 — Text editing in message composers and post editor

### C1. Enter/Shift+Enter in the message composer (Quill)
- **Symptom**: Multi-line DMs are effectively impossible from Firefox. Enter either sends the message prematurely, inserts an invisible break, or leaves the caret in the wrong place so the next character lands in the wrong paragraph.
- **Underlying**:
  - Mozilla bug 1040445 (Enter doesn't advance cursor in contenteditable).
  - Mozilla bug 1297414 (defaultParagraphSeparator mismatch — Firefox defaults to `<br>`, Quill expects `<div>/<p>`).
  - Quill's own Firefox regressions around JS-initialized editors (slab/quill#1760).
  - Historically bug 1615852 amplified this; now fixed upstream but Quill's model may still misbehave independently.
- **Fix approach**: Intercept `keydown` in capture phase on any matching composer element. Classify Enter (bare → submit or newline depending on surface). On newline intent, preempt Quill's broken path: construct the break via `Range.insertNode(<br>)` + sentinel BR for trailing caret, restore selection, dispatch a synthetic `InputEvent('input', { inputType: 'insertLineBreak' })` so Quill's model stays in sync.
- **Matches**: DM thread composer, DM standalone window, post composer, comment composer, repost composer.
- **Module**: `fix-crlf` (in progress, `feature/fix-crlf`).

### C2. Enter in the post composer
- **Symptom**: Posts published from Firefox end up as a single wall of text because paragraph separators are lost on the wire — LinkedIn's sanitizer strips the wrong kind of break.
- **Underlying**: Same root as C1, different surface. Post editor uses a similar Quill model wrapped differently.
- **Fix approach**: Same handler, different selectors. Verify serialization: the fix must produce break nodes that LinkedIn's serializer preserves, not ones it strips.
- **Module**: extend `fix-crlf` to cover the post editor selectors.

### C3. Paste destroys formatting
- **Symptom**: Pasting from Word/Notion/Google Docs into LinkedIn composers collapses everything into one line or inserts spurious newlines. Well-documented in LinkedIn formatting guides (see sources).
- **Underlying**: Firefox bug 647779 (paste-path newline handling with `white-space: pre-wrap`), plus LinkedIn's client sanitizer stripping what it doesn't expect.
- **Fix approach**: Intercept `paste` event, read `text/plain` from the clipboard, re-insert as a sequence of text nodes + break nodes using the same code path as C1. Optionally consult `text/html` for soft-break hints.
- **Module**: `fix-paste` (planned, blocked by `fix-crlf` landing shared insert helper).

### C4. Backspace in multi-line composer deletes across paragraph boundaries wrong
- **Symptom**: Backspace at the start of a line in a multi-line DM deletes the wrong node, sometimes the whole previous paragraph.
- **Underlying**: Mozilla bug 1735608 — Firefox's backwards block-level deletion differs from Chrome.
- **Fix approach**: Intercept `keydown` Backspace at empty line start; reimplement the merge using `Range` ops.
- **Module**: `fix-backspace` (planned, lower priority than C1–C3).

## P1 — Non-editing but frequently reported

### C5. Space key stops working in Quill editors on Firefox
- **Symptom**: Under specific activation timing, the space key does nothing in a Quill-based editor on Firefox.
- **Underlying**: slab/quill#1760.
- **Fix approach**: Detect swallowed space at capture phase; synthesize an input event.
- **Module**: `fix-space` (planned, low priority — only reproduces on cold-init edge cases).

### C6. Message templates / autocomplete insertions collapse to a single line
- **Symptom**: Third-party tools (Briskine, Gorgias) cannot insert multi-line templates into LinkedIn. Also affects any user workflow that pastes template-like content.
- **Underlying**: Combined C1 + C3.
- **Fix approach**: Exposed side-effect of fixing C1 and C3; no dedicated module.

## P2 — General LinkedIn-on-Firefox breakage (out of scope for v0.0.1)

- C7. Intermittent "can't load messages/notifications" — network/SPA hydration issue, not a text editing problem.
- C8. Feed scroll performance — browser engine workload, not a fixable site bug.
- C9. LinkedIn explicitly lists Firefox as a supported browser but funnels bug reports to "try a different browser" as the first troubleshooting step. Cultural, not technical.

## Ranking justification

Top priority is C1 because:
1. It blocks the user's explicit primary workflow (DMs, cold outreach).
2. It has multiple known upstream root causes that make a pure platform fix unlikely anytime soon.
3. It is locally testable against a static DOM fixture — no account risk.
4. A clean `Range.insertNode` + selection restore + synthetic InputEvent is a narrow, well-understood intervention.

C2 follows because it shares the implementation with C1 at near-zero marginal cost.
C3 is the natural next fix; it reuses the shared insertion helper from C1.
C4 and C5 are follow-ups that extend the same capture-phase event handler model.

## Backlog as GitHub issues

Each of C2–C6 is filed as a tracking issue in `digitalby/linkedin-firefox-fixer` (see issue numbers in commit log). C1 is tracked directly via `feature/fix-crlf`.
