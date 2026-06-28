import { describe, expect, it } from 'vitest';

import { rollDiceExpression } from '../../src/expressionApi';

describe('explicit modifier boundaries', () => {
  it('rejects invalid suffix tails instead of turning them into modifiers', () => {
    expect(() => rollDiceExpression('1d6rr5min<=5')).toThrow(/unexpected/i);
    expect(() => rollDiceExpression('1d6min<=5')).toThrow(/unexpected/i);
    expect(() => rollDiceExpression('1d6cs>=8foo2')).toThrow(/unexpected/i);
  });

  it('only accepts numeric modifiers when sign-prefixed', () => {
    expect(() => rollDiceExpression('5')).toThrow(/numeric modifier/i);
    expect(() => rollDiceExpression('1d6 5')).toThrow(/numeric modifier/i);
    expect(() => rollDiceExpression('1d6+5-5')).not.toThrow();
  });
});
