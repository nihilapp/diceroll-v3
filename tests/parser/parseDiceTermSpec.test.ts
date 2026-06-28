import { describe, expect, it } from 'vitest';

import { parseDiceBlockSpec } from '../../src/utils/parseDiceBlocks';
import { parseDiceModifiers } from '../../src/utils/parseDiceModifiers';

describe('parseDiceBlockSpec', () => {
  it('returns base plus ordered modifiers', () => {
    const spec = parseDiceBlockSpec('4D6rr1kh3');
    expect(spec).toMatchObject({
      count: 4,
      sides: 6,
      modifiers: [
        { kind: 'rerollRecursive', },
        {
          kind: 'keepHighest',
          count: 3,
        },
      ],
    });
  });
});

describe('modifier compatibility policy', () => {
  it('parses r as reroll once and rr as recursive reroll', () => {
    expect(parseDiceModifiers('r1rr<3', 6)).toEqual([
      {
        kind: 'rerollOnce',
        predicate: {
          op: '=',
          value: 1,
        },
        source: 'fvtt-r',
      },
      {
        kind: 'rerollRecursive',
        predicate: {
          op: '<',
          value: 3,
        },
        source: 'fvtt-rr',
      },
    ]);
  });

  it('rejects removed ro syntax', () => {
    expect(() => parseDiceModifiers('ro1', 6)).toThrow(/ro/i);
  });
});
