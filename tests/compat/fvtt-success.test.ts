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

describe('FVTT success-family modifiers', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('parses cs, cf, df, sf, ms modifiers', () => {
    const spec = parseDiceBlockSpec('5D10cs>=8cf=1df=1sf<3ms>=5');
    expect(spec).toMatchObject({
      modifiers: [
        {
          kind: 'countSuccess',
          predicate: {
            op: '>=',
            value: 8,
          },
        },
        {
          kind: 'countFailure',
          predicate: {
            op: '=',
            value: 1,
          },
        },
        {
          kind: 'deductFailures',
          predicate: {
            op: '=',
            value: 1,
          },
        },
        {
          kind: 'subtractFailureFaces',
          predicate: {
            op: '<',
            value: 3,
          },
        },
        {
          kind: 'marginSuccess',
          predicate: {
            op: '>=',
            value: 5,
          },
        },
      ],
    });
  });

  it('counts successes through public API', () => {
    mockRandomSequence([
      0.99,
      0.83,
      0.16,
      0,
      0.66,
    ]);
    const [ result, ] = rollDiceExpression('5d10cs>=8');
    expect(result.rollDetails[0].kind).toBe('success');
    expect(result.total).toBe(2);
  });

  it('supports bare cs using maximum face as default target', () => {
    mockRandomSequence([
      0.99,
      0.83,
      0.99,
    ]);
    const [ result, ] = rollDiceExpression('3d10cs');
    expect(result.total).toBe(2);
  });

  it('counts failures and deducts them with default low-face target', () => {
    mockRandomSequence([
      0,
      0.2,
      0,
      0.6,
      0,
      0.2,
      0,
      0.6,
    ]);
    const [
      failureCount,
      deducted,
    ] = rollDiceExpression('4d6cf 4d6df');
    expect(failureCount.total).toBe(2);
    expect(deducted.total).toBe(-2);
  });

  it('subtracts failed face values and computes margin success', () => {
    mockRandomSequence([
      0.99,
      0.83,
      0,
      0.99,
      0.66,
      0,
    ]);
    const [
      subtractFaces,
      margin,
    ] = rollDiceExpression('3d6sf<3 3d6ms>10');
    expect(subtractFaces.total).toBe(11);
    expect(margin.total).toBe(1);
  });

  it('counts even and odd results', () => {
    mockRandomSequence([
      0,
      0.2,
      0.5,
      0.83,
      0,
      0.2,
      0.5,
      0.83,
    ]);
    const [
      even,
      odd,
    ] = rollDiceExpression('4d6even 4d6odd');
    expect(even.total).toBe(2);
    expect(odd.total).toBe(2);
  });
});
