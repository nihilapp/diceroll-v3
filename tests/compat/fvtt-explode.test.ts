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
    expect(parseDiceBlockSpec('2D6x5')).toMatchObject({
      modifiers: [
        {
          kind: 'explode',
          limit: 5,
          source: 'fvtt-x',
        },
      ],
    });
    expect(parseDiceBlockSpec('2D10x2>=9')).toMatchObject({
      modifiers: [
        {
          kind: 'explode',
          limit: 2,
          predicate: {
            op: '>=',
            value: 9,
          },
          source: 'fvtt-x',
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

  it('does not treat x numeric caps as numeric modifiers', () => {
    mockRandomSequence([ 0.83, ]);
    const [ result, ] = rollDiceExpression('1d6x5');
    expect(result.modifiers).toEqual([]);
    expect(result.rollDetails[0]).toMatchObject({
      block: '1D6x5',
      kind: 'explode',
      contribution: 5,
    });
    expect(result.total).toBe(5);
  });

  it('still allows explicit numeric modifiers after explode blocks', () => {
    const [ result, ] = rollDiceExpression('1d6x5+5');
    expect(result.rollDetails[0].block).toBe('1D6x5');
    expect(result.modifiers).toEqual([
      {
        sign: '+',
        value: 5,
      },
    ]);
  });

  it('supports chained comparison explode plus min modifiers through public API', () => {
    mockRandomSequence([
      0.16,
      0.99,
    ]);
    const [ result, ] = rollDiceExpression('1d6x<=5min5');
    expect(result.modifiers).toEqual([]);
    expect(result.rollDetails[0]).toMatchObject({
      block: '1D6x<=5min5',
      kind: 'explode',
      contribution: 11,
    });
    expect(result.total).toBe(11);
  });
});
