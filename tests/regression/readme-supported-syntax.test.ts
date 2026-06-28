import { describe, expect, it } from 'vitest';

import { rollDiceExpression } from '../../src/expressionApi';

describe('documented syntax regression', () => {
  it('keeps reroll and explode syntax in sync', () => {
    expect(() => rollDiceExpression('1d6r1')).not.toThrow();
    expect(() => rollDiceExpression('1d6rr1')).not.toThrow();
    expect(() => rollDiceExpression('1d6x')).not.toThrow();
    expect(() => rollDiceExpression('1d6xo')).not.toThrow();
    expect(() => rollDiceExpression('1d6ro1')).toThrow();
  });
});
