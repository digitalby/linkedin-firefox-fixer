# Sources

Retrieved 2026-04-12 via WebSearch/WebFetch.

## Mozilla Bugzilla — contenteditable on Firefox

- [1615852 — broken `<br>` workaround in `<div contenteditable>`](https://bugzilla.mozilla.org/show_bug.cgi?id=1615852) — **RESOLVED FIXED** in Firefox 135/145. Firefox auto-inserts padding `<br>` in empty contenteditable blocks; cleanup logic was incomplete. Affected Google Sheets, Chess.com, Froala, Odoo.
- [1291467 — Implement `contenteditable="plaintext-only"`](https://bugzilla.mozilla.org/show_bug.cgi?id=1291467) — plaintext-only mode, relevant when upstream expects LF-only content.
- [1297414 — Generate `<p>/<div>` for newlines, not `<br>` (defaultParagraphSeparator)](https://bugzilla.mozilla.org/show_bug.cgi?id=1297414) — core source of the LinkedIn/Firefox impedance mismatch. Firefox's native separator differs from what Chrome/Quill expect.
- [1040445 — Inserting newline in contenteditable div does not advance cursor](https://bugzilla.mozilla.org/show_bug.cgi?id=1040445) — matches the symptom users describe: Enter inserts a node but the caret stays put, so the next keystroke overwrites or lands in the wrong place.
- [1735608 — contentEditable backwards block deletion on Firefox](https://bugzilla.mozilla.org/show_bug.cgi?id=1735608) — Firefox deletes block-level elements "backwards" vs Chrome/OS. Affects backspace in composers.
- [647779 — pasting into contenteditable with `white-space: pre-wrap` adds spurious newlines](https://bugzilla.mozilla.org/show_bug.cgi?id=647779) — related paste-path bug.

## Quill / Quill-based editors

- [slab/quill#1760 — Space key doesn't work in Firefox when Quill created via JS](https://github.com/slab/quill/issues/1760) — Firefox-only regression in Quill.
- [slab/quill#1624 — pasting multiple lines into a code block breaks it](https://github.com/slab/quill/issues/1624) — paste path.
- [Billauer — Quill, Shift-Enter and `<br>` tags](https://billauer.se/blog/2021/12/quill-br-shift-enter/) — how Quill handles Shift+Enter vs Enter; LinkedIn inherits this model.
- [zenoamaro/react-quill#513 — implementing new line in editor](https://github.com/zenoamaro/react-quill/issues/513)

## LinkedIn-specific third-party reports

- [Briskine/briskine#386 — Can't insert templates in LinkedIn New Post and Comment editors](https://github.com/Briskine/briskine/issues/386) — LinkedIn does not support inserting multi-line templates; all templates collapse to a single line. This is the exact symptom users complain about.
- [Gorgias templates — same issue](https://github.com/gorgias/gorgias-templates/issues/386)

## Mozilla Support / user reports

- [support.mozilla.org/1188883 — can't get into LinkedIn on Firefox](https://support.mozilla.org/en-US/questions/1188883)
- [support.mozilla.org/1295427 — Problème avec LinkedIn (FR)](https://support.mozilla.org/en-US/questions/1295427)
- [windowsreport.com — LinkedIn not working in Firefox: 7 confirmed fixes](https://windowsreport.com/linkedin-not-working-firefox/) — dated Sep 2025, most recent general writeup.

## Webcompat precedent

- Firefox shipped a webcompat intervention for Reddit's contenteditable copy-paste in Firefox 114 ([Bugzilla 1739791](https://bugzilla.mozilla.org/show_bug.cgi?id=1739791)) and editor breakage ([Bugzilla 1808544](https://bugzilla.mozilla.org/show_bug.cgi?id=1808544)). Strong precedent that these problems are real and addressable via shim code — this extension is effectively a user-space webcompat shim for LinkedIn.

## Other related

- [SillyTavern#2777 — Firefox contentEditable duplicates line breaks](https://github.com/SillyTavern/SillyTavern/issues/2777)
- [ianstormtaylor/slate#1744 — `<input>` inside `contenteditable="false"` broken in Firefox](https://github.com/ianstormtaylor/slate/issues/1744)
- [stephenhaney.com — get contenteditable plaintext with correct linebreaks](https://stephenhaney.com/2020/get-contenteditable-plaintext-with-correct-linebreaks/)
