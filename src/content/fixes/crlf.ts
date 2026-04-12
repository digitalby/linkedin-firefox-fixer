import type { FixDisposable, FixModule } from '../../types/module.js';
import { classifyEnter } from '../lib/keys.js';

const COMPOSER_SELECTORS = [
  '[contenteditable="true"][role="textbox"]',
  '.msg-form__contenteditable',
  '.ql-editor[contenteditable="true"]',
];

function isComposer(el: Element): el is HTMLElement {
  if (!(el instanceof HTMLElement)) return false;
  return COMPOSER_SELECTORS.some((sel) => el.matches(sel));
}

function insertLineBreak(target: HTMLElement): void {
  const selection = target.ownerDocument.getSelection();
  if (!selection || selection.rangeCount === 0) return;
  const range = selection.getRangeAt(0);
  range.deleteContents();

  const br = target.ownerDocument.createElement('br');
  range.insertNode(br);

  const trailing = br.nextSibling;
  if (!trailing || trailing.nodeName !== 'BR') {
    const sentinel = target.ownerDocument.createElement('br');
    br.after(sentinel);
  }

  const newRange = target.ownerDocument.createRange();
  newRange.setStartAfter(br);
  newRange.collapse(true);
  selection.removeAllRanges();
  selection.addRange(newRange);

  target.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertLineBreak' }));
}

export const crlfFix: FixModule = {
  id: 'fix-crlf',
  title: 'Restore multi-line text editing',
  description:
    'Makes Shift+Enter and Enter behave correctly in LinkedIn message and post composers on Firefox.',
  matches(url: URL): boolean {
    return url.hostname === 'www.linkedin.com';
  },
  install(root: Document): FixDisposable {
    const onKeyDown = (event: KeyboardEvent): void => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (!isComposer(target)) return;

      const intent = classifyEnter(event, false);
      if (intent.kind !== 'newline') return;

      event.preventDefault();
      event.stopPropagation();
      insertLineBreak(target);
    };

    root.addEventListener('keydown', onKeyDown, { capture: true });

    return {
      dispose(): void {
        root.removeEventListener('keydown', onKeyDown, { capture: true });
      },
    };
  },
};
