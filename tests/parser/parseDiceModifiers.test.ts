import { describe, expect, it } from 'vitest';

import { parseDiceModifiers } from '../../src/utils/parseDiceModifiers';

describe('parseDiceModifiers', () => {
  it('parses rr, kh, x in one suffix stream', () => {
    expect(parseDiceModifiers('rr1kh3x', 6)).toEqual([
      {
        kind: 'rerollRecursive',
        predicate: {
          op: '=',
          value: 1,
        },
        source: 'fvtt-rr',
      },
      {
        kind: 'keepHighest',
        count: 3,
      },
      {
        kind: 'explode',
        source: 'fvtt-x',
      },
    ]);
  });
});
