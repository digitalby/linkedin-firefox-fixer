import { describe, it, expect } from 'vitest';
import { classifyEnter } from '../../src/content/lib/keys.js';

function ev(init: Partial<KeyboardEventInit> & { key: string }): KeyboardEvent {
  return new KeyboardEvent('keydown', init);
}

describe('classifyEnter', () => {
  it('ignores non-Enter keys', () => {
    expect(classifyEnter(ev({ key: 'a' }), false).kind).toBe('ignore');
  });

  it('bare Enter inserts newline when submitOnBareEnter is false', () => {
    expect(classifyEnter(ev({ key: 'Enter' }), false).kind).toBe('newline');
  });

  it('Ctrl+Enter submits', () => {
    expect(classifyEnter(ev({ key: 'Enter', ctrlKey: true }), false).kind).toBe('submit');
  });

  it('Meta+Enter submits', () => {
    expect(classifyEnter(ev({ key: 'Enter', metaKey: true }), false).kind).toBe('submit');
  });

  it('bare Enter submits when submitOnBareEnter is true', () => {
    expect(classifyEnter(ev({ key: 'Enter' }), true).kind).toBe('submit');
  });

  it('Shift+Enter inserts newline when submitOnBareEnter is true', () => {
    expect(classifyEnter(ev({ key: 'Enter', shiftKey: true }), true).kind).toBe('newline');
  });

  it('ignores Enter during IME composition', () => {
    expect(
      classifyEnter(new KeyboardEvent('keydown', { key: 'Enter', isComposing: true }), false).kind,
    ).toBe('ignore');
  });
});
