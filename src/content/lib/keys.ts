export interface EnterIntent {
  readonly kind: 'newline' | 'submit' | 'ignore';
}

export function classifyEnter(event: KeyboardEvent, submitOnBareEnter: boolean): EnterIntent {
  if (event.key !== 'Enter') return { kind: 'ignore' };
  if (event.isComposing) return { kind: 'ignore' };

  const shift = event.shiftKey;
  const mod = event.ctrlKey || event.metaKey;

  if (submitOnBareEnter) {
    if (shift || mod) return { kind: 'newline' };
    return { kind: 'submit' };
  }
  if (mod) return { kind: 'submit' };
  return { kind: 'newline' };
}
