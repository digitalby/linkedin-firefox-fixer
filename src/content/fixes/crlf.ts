import type { FixDisposable, FixModule } from '../../types/module.js';
import { classifyEnter } from '../lib/keys.js';

interface Surface {
  readonly selector: string;
  readonly submitOnBareEnter: boolean;
}

const SURFACES: readonly Surface[] = [
  { selector: '.msg-form__contenteditable', submitOnBareEnter: true },
  { selector: '.comments-comment-box__editor', submitOnBareEnter: true },
  { selector: '.share-creation-state .ql-editor', submitOnBareEnter: false },
  { selector: '[contenteditable="true"][role="textbox"]', submitOnBareEnter: true },
];

function matchSurface(el: Element): Surface | null {
  if (!(el instanceof HTMLElement)) return null;
  for (const surface of SURFACES) {
    if (el.matches(surface.selector)) return surface;
  }
  return null;
}

const ZWSP = '\u200B';

function insertLineBreak(target: HTMLElement): void {
  const doc = target.ownerDocument;
  const selection = doc.getSelection();
  if (!selection || selection.rangeCount === 0) return;
  const range = selection.getRangeAt(0);

  const fragment = doc.createDocumentFragment();
  const br = doc.createElement('br');
  const caretAnchor = doc.createTextNode(ZWSP);
  fragment.append(br, caretAnchor);

  range.deleteContents();
  range.insertNode(fragment);

  const newRange = doc.createRange();
  newRange.setStart(caretAnchor, ZWSP.length);
  newRange.collapse(true);
  selection.removeAllRanges();
  selection.addRange(newRange);

  const stripZwsp = (): void => {
    if (caretAnchor.data.startsWith(ZWSP) && caretAnchor.data.length > ZWSP.length) {
      const savedSelection = doc.getSelection();
      const offset = savedSelection?.focusNode === caretAnchor ? savedSelection.focusOffset : null;
      caretAnchor.data = caretAnchor.data.slice(ZWSP.length);
      if (offset !== null && offset >= ZWSP.length) {
        const restored = doc.createRange();
        restored.setStart(caretAnchor, offset - ZWSP.length);
        restored.collapse(true);
        savedSelection?.removeAllRanges();
        savedSelection?.addRange(restored);
      }
      target.removeEventListener('input', stripZwsp, true);
    }
  };
  target.addEventListener('input', stripZwsp, true);

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
      const surface = matchSurface(target);
      if (!surface) return;

      const intent = classifyEnter(event, surface.submitOnBareEnter);
      if (intent.kind !== 'newline') return;

      event.preventDefault();
      event.stopPropagation();
      insertLineBreak(target as HTMLElement);
    };

    root.addEventListener('keydown', onKeyDown, { capture: true });

    return {
      dispose(): void {
        root.removeEventListener('keydown', onKeyDown, { capture: true });
      },
    };
  },
};
