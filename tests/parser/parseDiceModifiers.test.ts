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

  it('parses x numeric caps and chained comparison predicates', () => {
    expect(parseDiceModifiers('x5min5', 6)).toEqual([
      {
        kind: 'explode',
        limit: 5,
        source: 'fvtt-x',
      },
      {
        kind: 'minimum',
        value: 5,
      },
    ]);

    expect(parseDiceModifiers('x2>=9', 10)).toEqual([
      {
        kind: 'explode',
        limit: 2,
        predicate: {
          op: '>=',
          value: 9,
        },
        source: 'fvtt-x',
      },
    ]);
  });
});
