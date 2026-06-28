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

describe('FVTT explode compatibility', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('parses x and xo alongside bang forms', () => {
    expect(parseDiceBlockSpec('2D6x')).toMatchObject({
      modifiers: [
        {
          kind: 'explode',
          source: 'fvtt-x',
        },
      ],
    });
    expect(parseDiceBlockSpec('2D6xo')).toMatchObject({
      modifiers: [
        {
          kind: 'explodeOnce',
          source: 'fvtt-xo',
        },
      ],
    });
    expect(parseDiceBlockSpec('2D6!')).toMatchObject({
      modifiers: [
        {
          kind: 'explode',
          source: 'bang',
        },
      ],
    });
    expect(parseDiceBlockSpec('2D6!!')).toMatchObject({
      modifiers: [
        {
          kind: 'compound',
          source: 'bang-bang',
        },
      ],
    });
  });

  it('supports x through public API', () => {
    mockRandomSequence([
      0.99,
      0.33,
    ]);
    const [ result, ] = rollDiceExpression('1d6x');
    expect(result.rollDetails[0].kind).toBe('explode');
    expect(result.total).toBeGreaterThan(6);
  });

  it('supports xo through public API', () => {
    mockRandomSequence([
      0.99,
      0.33,
      0.16,
    ]);
    const [ result, ] = rollDiceExpression('1d6xo');
    expect(result.rollDetails[0].kind).toBe('explodeOnce');
    expect(result.total).toBe(8);
  });
});
