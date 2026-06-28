import { afterEach, describe, expect, it, vi } from 'vitest';

import { rollDiceExpression } from '../../src/expressionApi';
import { parseDiceBlockSpec } from '../../src/utils/parseDiceBlocks';

function mockRandomSequence(values: number[]): void {
  let index = 0;
  vi.spyOn(Math, 'random').mockImplementation(() => {
    const value = values[Math.min(index, values.length - 1)];
    index += 1;
    return value;
  });
}

describe('project extensions and mixed modifiers', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('supports min, rr, kh in one block', () => {
    const spec = parseDiceBlockSpec('4D6min2rr1kh3');
    expect(spec).toMatchObject({
      modifiers: [
        {
          kind: 'minimum',
          value: 2,
        },
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
      ],
    });
  });

  it('supports FVTT keep/drop shorthand forms', () => {
    expect(parseDiceBlockSpec('4D6k')).toMatchObject({
      modifiers: [
        {
          kind: 'keepHighest',
          count: 1,
        },
      ],
    });
    expect(parseDiceBlockSpec('4D6kl')).toMatchObject({
      modifiers: [
        {
          kind: 'keepLowest',
          count: 1,
        },
      ],
    });
    expect(parseDiceBlockSpec('4D6d')).toMatchObject({
      modifiers: [
        {
          kind: 'dropLowest',
          count: 1,
        },
      ],
    });
    expect(parseDiceBlockSpec('4D6dh')).toMatchObject({
      modifiers: [
        {
          kind: 'dropHighest',
          count: 1,
        },
      ],
    });
  });

  it('keeps !! extension alongside FVTT modifiers', () => {
    mockRandomSequence([
      0.99,
      0.5,
      0.66,
    ]);
    const [ result, ] = rollDiceExpression('1d6!!');
    expect(result.rollDetails[0].kind).toBe('compound');
    expect(result.total).toBe(10);
  });
});
