import { describe, expect, it } from 'vitest';

import { matches } from './search';

describe('matches', () => {
  it('matches nested values case-insensitively and ignores query padding', () => {
    expect(matches({ title: 'High Pulldown', tags: ['Back'] }, ' pulldown ')).toBe(true);
    expect(matches({ title: 'High Pulldown' }, 'PULLDOWN')).toBe(true);
  });

  it('returns false instead of throwing for non-serializable values', () => {
    const item: Record<string, unknown> = { title: 'safe' };
    item.self = item;

    expect(matches(item, 'safe')).toBe(false);
  });
});
