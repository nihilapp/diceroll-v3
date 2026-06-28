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

describe('FVTT reroll compatibility', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('maps r to reroll once', () => {
    const spec = parseDiceBlockSpec('1D6r1');
    expect(spec).toMatchObject({
      modifiers: [
        {
          kind: 'rerollOnce',
          source: 'fvtt-r',
        },
      ],
    });
  });

  it('maps rr to recursive reroll', () => {
    const spec = parseDiceBlockSpec('1D6rr1');
    expect(spec).toMatchObject({
      modifiers: [
        {
          kind: 'rerollRecursive',
          source: 'fvtt-rr',
        },
      ],
    });
  });

  it('accepts rr and kh in same block through public API', () => {
    mockRandomSequence([
      0,
      0.5,
      0.99,
      0.66,
      0.83,
    ]);
    const [ result, ] = rollDiceExpression('4d6rr1kh3');

    expect(result.rollDetails[0].block).toBe('4D6rr1kh3');
    expect(result.rollDetails[0].kind).toBe('keepHighest');
    expect(result.rollDetails[0].total ?? result.rollDetails[0].contribution).toBeDefined();
  });
});
