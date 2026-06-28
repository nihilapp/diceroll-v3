import type { ComparisonOperator, ComparisonPredicate, DiceModifierSpec } from './diceModifierTypes';

function readComparison(rest: string): { predicate: ComparisonPredicate;
  length: number; } | null {
  const match = rest.match(/^([><]=|[><=])?(\d+)/);
  if (!match) return null;

  return {
    predicate: {
      op: (match[1] || '=') as ComparisonOperator,
      value: parseInt(match[2], 10),
    },
    length: match[0].length,
  };
}

function getDefaultPredicate(
  kind: 'r' | 'rr' | 'x' | 'xo' | 'cs' | 'cf' | 'df' | 'sf',
  sides: number
): ComparisonPredicate {
  if (kind === 'x' || kind === 'xo' || kind === 'cs') {
    return {
      op: '=',
      value: sides,
    };
  }

  return {
    op: '=',
    value: 1,
  };
}

function readOneModifier(rest: string, sides: number): { modifier: DiceModifierSpec;
  length: number; } | null {
  if (rest.startsWith('ro')) {
    throw new Error('Modifier ro is removed. Use r or rr.');
  }

  if (rest.startsWith('rr')) {
    const comparison = readComparison(rest.slice(2));
    const resolved = comparison || {
      predicate: getDefaultPredicate('rr', sides),
      length: 0,
    };
    return {
      modifier: {
        kind: 'rerollRecursive',
        predicate: resolved.predicate,
        source: 'fvtt-rr',
      },
      length: 2 + resolved.length,
    };
  }

  if (rest.startsWith('r')) {
    const comparison = readComparison(rest.slice(1));
    const resolved = comparison || {
      predicate: getDefaultPredicate('r', sides),
      length: 0,
    };
    return {
      modifier: {
        kind: 'rerollOnce',
        predicate: resolved.predicate,
        source: 'fvtt-r',
      },
      length: 1 + resolved.length,
    };
  }

  if (rest.startsWith('xo')) {
    return {
      modifier: {
        kind: 'explodeOnce',
        source: 'fvtt-xo',
      },
      length: 2,
    };
  }

  if (rest.startsWith('x')) {
    return {
      modifier: {
        kind: 'explode',
        source: 'fvtt-x',
      },
      length: 1,
    };
  }

  if (rest.startsWith('!!')) {
    return {
      modifier: {
        kind: 'compound',
        source: 'bang-bang',
      },
      length: 2,
    };
  }

  if (rest.startsWith('!')) {
    return {
      modifier: {
        kind: 'explode',
        source: 'bang',
      },
      length: 1,
    };
  }

  const successFamily = rest.match(/^(cs|cf|df|sf|ms)(?:([><]=|[><=])(\d+))?/);
  if (successFamily) {
    if (successFamily[1] === 'ms' && (!successFamily[2] || !successFamily[3])) {
      return null;
    }
    const kindMap = {
      cs: 'countSuccess',
      cf: 'countFailure',
      df: 'deductFailures',
      sf: 'subtractFailureFaces',
      ms: 'marginSuccess',
    } as const;
    const predicate = successFamily[2] && successFamily[3]
      ? {
        op: successFamily[2] as ComparisonOperator,
        value: parseInt(successFamily[3], 10),
      }
      : getDefaultPredicate(successFamily[1] as 'cs' | 'cf' | 'df' | 'sf', sides);
    return {
      modifier: {
        kind: kindMap[successFamily[1] as keyof typeof kindMap],
        predicate,
      },
      length: successFamily[0].length,
    };
  }

  const keepDrop = rest.match(/^(kh|kl|dh|dl|k|d)(\d*)/);
  if (keepDrop) {
    const count = keepDrop[2]
      ? parseInt(keepDrop[2], 10)
      : 1;
    const kindMap = {
      kh: 'keepHighest',
      kl: 'keepLowest',
      dh: 'dropHighest',
      dl: 'dropLowest',
      k: 'keepHighest',
      d: 'dropLowest',
    } as const;
    return {
      modifier: {
        kind: kindMap[keepDrop[1] as keyof typeof kindMap],
        count,
      },
      length: keepDrop[0].length,
    };
  }

  const minMax = rest.match(/^(min|max)(\d+)/);
  if (minMax) {
    return {
      modifier: {
        kind: minMax[1] === 'min'
          ? 'minimum'
          : 'maximum',
        value: parseInt(minMax[2], 10),
      },
      length: minMax[0].length,
    };
  }

  if (rest.startsWith('even')) {
    return {
      modifier: { kind: 'countEven', },
      length: 4,
    };
  }

  if (rest.startsWith('odd')) {
    return {
      modifier: { kind: 'countOdd', },
      length: 3,
    };
  }

  return null;
}

export function parseDiceModifiers(input: string, sides: number): DiceModifierSpec[] {
  const modifiers: DiceModifierSpec[] = [];
  let rest = input.toLowerCase();

  while (rest.length > 0) {
    const next = readOneModifier(rest, sides);
    if (!next) {
      throw new Error(`Unsupported modifier sequence: ${rest}`);
    }
    modifiers.push(next.modifier);
    rest = rest.slice(next.length);
  }

  return modifiers;
}
