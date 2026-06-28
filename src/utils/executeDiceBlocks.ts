import { rollBasic } from '../roll/rollBasic';
import { rollCompound } from '../roll/rollCompound';
import { rollDropHighest } from '../roll/rollDropHighest';
import { rollDropLowest } from '../roll/rollDropLowest';
import { rollExplode } from '../roll/rollExplode';
import { rollFate } from '../roll/rollFate';
import { rollKeepHighest } from '../roll/rollKeepHighest';
import { rollKeepLowest } from '../roll/rollKeepLowest';
import { rollNetSuccess } from '../roll/rollNetSuccess';
import { rollPercentile } from '../roll/rollPercentile';
import { rollReroll } from '../roll/rollReroll';
import { rollRerollOnce } from '../roll/rollRerollOnce';
import { rollSuccess } from '../roll/rollSuccess';
import type { DiceBlockRollDetail, DiceRollResult, ModifierEntry, RollResult } from '../types';

import type { ComparisonPredicate, DiceTermSpec } from './diceModifierTypes';
import type { DiceBlockSpec, ParsedTerm } from './parseDiceBlocks';
import { parseDiceBlockSpec } from './parseDiceBlocks';

function compare(result: number, predicate: ComparisonPredicate): boolean {
  if (predicate.op === '=') return result === predicate.value;
  if (predicate.op === '>') return result > predicate.value;
  if (predicate.op === '>=') return result >= predicate.value;
  if (predicate.op === '<') return result < predicate.value;
  if (predicate.op === '<=') return result <= predicate.value;
  return false;
}

function rollSingle(sides: number): DiceRollResult {
  return rollBasic(1, sides).rolls[0];
}

function inferKind(spec: DiceTermSpec): DiceBlockRollDetail['kind'] {
  for (let i = spec.modifiers.length - 1; i >= 0; i--) {
    const modifier = spec.modifiers[i];
    switch (modifier.kind) {
      case 'keepHighest':
      case 'keepLowest':
      case 'dropHighest':
      case 'dropLowest':
      case 'explode':
      case 'explodeOnce':
      case 'compound':
      case 'rerollOnce':
        return modifier.kind;
      case 'rerollRecursive':
        return 'reroll';
      case 'countSuccess':
        return 'success';
      case 'countFailure':
      case 'deductFailures':
      case 'subtractFailureFaces':
      case 'marginSuccess':
      case 'countEven':
      case 'countOdd':
        return modifier.kind;
      default:
        break;
    }
  }

  return 'basic';
}

function executeDiceTermSpec(spec: DiceTermSpec): {
  contribution: number;
  rollResult: RollResult;
  kind: DiceBlockRollDetail['kind'];
} {
  let all = rollBasic(spec.count, spec.sides).rolls;
  let current = [ ...all, ];
  let dropped: DiceRollResult[] = [];

  for (const modifier of spec.modifiers) {
    switch (modifier.kind) {
      case 'rerollOnce': {
        current = current.map((roll) => compare(roll.result, modifier.predicate)
          ? rollSingle(spec.sides)
          : roll);
        all = [ ...current, ];
        break;
      }
      case 'rerollRecursive': {
        current = current.map((roll) => {
          let next = roll;
          let iterations = 0;
          while (compare(next.result, modifier.predicate) && iterations < 1000) {
            next = rollSingle(spec.sides);
            iterations++;
          }
          return next;
        });
        all = [ ...current, ];
        break;
      }
      case 'explode': {
        const nextRolls = [ ...current, ];
        for (const roll of current) {
          let probe = roll;
          let iterations = 0;
          const limit = modifier.limit ?? 1000;
          while (compare(probe.result, modifier.predicate || {
            op: '=',
            value: spec.sides,
          }) && iterations < limit) {
            probe = rollSingle(spec.sides);
            nextRolls.push(probe);
            iterations++;
          }
        }
        current = nextRolls;
        all = [ ...current, ];
        break;
      }
      case 'explodeOnce': {
        const nextRolls = [ ...current, ];
        for (const roll of current) {
          if (compare(roll.result, modifier.predicate || {
            op: '=',
            value: spec.sides,
          })) {
            nextRolls.push(rollSingle(spec.sides));
          }
        }
        current = nextRolls;
        all = [ ...current, ];
        break;
      }
      case 'compound': {
        current = current.map((roll) => {
          let total = roll.result;
          let probe = roll;
          let iterations = 0;
          while (probe.result >= spec.sides && iterations < 1000) {
            probe = rollSingle(spec.sides);
            total += probe.result;
            iterations++;
          }
          return {
            minNumber: roll.minNumber,
            maxNumber: roll.maxNumber,
            result: total,
            isFumble: roll.isFumble,
            isCritical: roll.isCritical,
          };
        });
        all = [ ...current, ];
        break;
      }
      case 'keepHighest': {
        const sorted = [ ...current, ].sort((a, b) => b.result - a.result);
        current = sorted.slice(0, modifier.count);
        dropped = sorted.slice(modifier.count);
        break;
      }
      case 'keepLowest': {
        const sorted = [ ...current, ].sort((a, b) => a.result - b.result);
        current = sorted.slice(0, modifier.count);
        dropped = sorted.slice(modifier.count);
        break;
      }
      case 'dropHighest': {
        const sorted = [ ...current, ].sort((a, b) => b.result - a.result);
        dropped = sorted.slice(0, modifier.count);
        current = sorted.slice(modifier.count);
        break;
      }
      case 'dropLowest': {
        const sorted = [ ...current, ].sort((a, b) => a.result - b.result);
        dropped = sorted.slice(0, modifier.count);
        current = sorted.slice(modifier.count);
        break;
      }
      case 'minimum': {
        current = current.map((roll) => ({
          ...roll,
          result: Math.max(modifier.value, roll.result),
          isFumble: Math.max(modifier.value, roll.result) === roll.minNumber,
          isCritical: Math.max(modifier.value, roll.result) === roll.maxNumber,
        }));
        all = [ ...current, ];
        break;
      }
      case 'maximum': {
        current = current.map((roll) => ({
          ...roll,
          result: Math.min(modifier.value, roll.result),
          isFumble: Math.min(modifier.value, roll.result) === roll.minNumber,
          isCritical: Math.min(modifier.value, roll.result) === roll.maxNumber,
        }));
        all = [ ...current, ];
        break;
      }
      default:
        break;
    }
  }

  const total = current.reduce((sum, roll) => sum + roll.result, 0);
  const kind = inferKind(spec);
  const successModifier = spec.modifiers.find((modifier) => modifier.kind === 'countSuccess');
  const failureModifier = spec.modifiers.find((modifier) => modifier.kind === 'countFailure');
  const deductModifier = spec.modifiers.find((modifier) => modifier.kind === 'deductFailures');
  const subtractModifier = spec.modifiers.find((modifier) => modifier.kind === 'subtractFailureFaces');
  const marginModifier = spec.modifiers.find((modifier) => modifier.kind === 'marginSuccess');
  const evenModifier = spec.modifiers.find((modifier) => modifier.kind === 'countEven');
  const oddModifier = spec.modifiers.find((modifier) => modifier.kind === 'countOdd');

  if (successModifier && successModifier.kind === 'countSuccess') {
    const successCount = current.filter((roll) => compare(roll.result, successModifier.predicate)).length;
    return {
      contribution: successCount,
      kind: 'success',
      rollResult: {
        kind: 'success',
        minNumber: 1,
        maxNumber: spec.sides,
        rolls: current,
        successCount,
      },
    };
  }

  if (failureModifier && failureModifier.kind === 'countFailure') {
    const successCount = current.filter((roll) => compare(roll.result, failureModifier.predicate)).length;
    return {
      contribution: successCount,
      kind: 'countFailure',
      rollResult: {
        kind: 'countFailure',
        minNumber: 1,
        maxNumber: spec.sides,
        rolls: current,
        successCount,
      },
    };
  }

  if (deductModifier && deductModifier.kind === 'deductFailures') {
    const failureCount = current.filter((roll) => compare(roll.result, deductModifier.predicate)).length;
    return {
      contribution: -failureCount,
      kind: 'deductFailures',
      rollResult: {
        kind: 'deductFailures',
        minNumber: 1,
        maxNumber: spec.sides,
        rolls: current,
        successCount: 0,
        failureCount,
        total: -failureCount,
      },
    };
  }

  if (subtractModifier && subtractModifier.kind === 'subtractFailureFaces') {
    const failureSum = current
      .filter((roll) => compare(roll.result, subtractModifier.predicate))
      .reduce((sum, roll) => sum + roll.result, 0);
    return {
      contribution: total - failureSum,
      kind: 'subtractFailureFaces',
      rollResult: {
        kind: 'subtractFailureFaces',
        minNumber: 1,
        maxNumber: spec.sides,
        rolls: current,
        total,
        failureSum,
      },
    };
  }

  if (marginModifier && marginModifier.kind === 'marginSuccess') {
    return {
      contribution: total - marginModifier.predicate.value,
      kind: 'marginSuccess',
      rollResult: {
        kind: 'marginSuccess',
        minNumber: 1,
        maxNumber: spec.sides,
        rolls: current,
        total,
        target: marginModifier.predicate.value,
      },
    };
  }

  if (evenModifier) {
    const successCount = current.filter((roll) => roll.result % 2 === 0).length;
    return {
      contribution: successCount,
      kind: 'countEven',
      rollResult: {
        kind: 'countEven',
        minNumber: 1,
        maxNumber: spec.sides,
        rolls: current,
        successCount,
      },
    };
  }

  if (oddModifier) {
    const successCount = current.filter((roll) => roll.result % 2 === 1).length;
    return {
      contribution: successCount,
      kind: 'countOdd',
      rollResult: {
        kind: 'countOdd',
        minNumber: 1,
        maxNumber: spec.sides,
        rolls: current,
        successCount,
      },
    };
  }

  if (kind === 'keepHighest' || kind === 'keepLowest' || kind === 'dropHighest' || kind === 'dropLowest') {
    return {
      contribution: total,
      kind,
      rollResult: {
        kind,
        minNumber: 1,
        maxNumber: spec.sides,
        all,
        kept: current,
        dropped,
        total,
      },
    };
  }

  return {
    contribution: total,
    kind,
    rollResult: {
      kind,
      minNumber: 1,
      maxNumber: spec.sides,
      rolls: current,
      total,
    } as RollResult,
  };
}

/**
 * 단일 주사위 블록 스펙을 실행하고, 기여값과 상세 결과 반환
 */
export function executeBlock(
  block: string,
  spec: DiceBlockSpec | null
): { contribution: number;
  rollResult: DiceBlockRollDetail['rollResult'];
  kind: DiceBlockRollDetail['kind']; } {
  if (!spec) {
    // 파싱 실패 시 기본 굴림으로 폴백 (NdX 로만 처리)
    const m = block.match(/^(\d*)D(\d+)/i);
    const count = m && m[1]
      ? parseInt(m[1], 10)
      : 1;
    const sides = m && m[2]
      ? parseInt(m[2], 10)
      : 6;
    const result = rollBasic(count, sides);
    return {
      contribution: result.total,
      rollResult: result,
      kind: result.kind,
    };
  }

  if ('modifiers' in spec) {
    return executeDiceTermSpec(spec);
  }

  switch (spec.kind) {
    case 'basic': {
      const r = rollBasic(spec.count, spec.sides);
      return {
        contribution: r.total,
        rollResult: r,
        kind: r.kind,
      };
    }
    case 'compound': {
      const r = rollCompound(spec.count, spec.sides, spec.threshold);
      return {
        contribution: r.total,
        rollResult: r,
        kind: r.kind,
      };
    }
    case 'explode': {
      const r = rollExplode(spec.count, spec.sides, spec.threshold);
      return {
        contribution: r.total,
        rollResult: r,
        kind: r.kind,
      };
    }
    case 'keepHighest': {
      const r = rollKeepHighest(spec.count, spec.sides, spec.keep);
      return {
        contribution: r.total,
        rollResult: r,
        kind: r.kind,
      };
    }
    case 'keepLowest': {
      const r = rollKeepLowest(spec.count, spec.sides, spec.keep);
      return {
        contribution: r.total,
        rollResult: r,
        kind: r.kind,
      };
    }
    case 'dropHighest': {
      const r = rollDropHighest(spec.count, spec.sides, spec.drop);
      return {
        contribution: r.total,
        rollResult: r,
        kind: r.kind,
      };
    }
    case 'dropLowest': {
      const r = rollDropLowest(spec.count, spec.sides, spec.drop);
      return {
        contribution: r.total,
        rollResult: r,
        kind: r.kind,
      };
    }
    case 'reroll': {
      const r = rollReroll(spec.count, spec.sides, (value) => compare(value, spec.predicate));
      return {
        contribution: r.total,
        rollResult: r,
        kind: r.kind,
      };
    }
    case 'rerollOnce': {
      const r = rollRerollOnce(spec.count, spec.sides, (value) => compare(value, spec.predicate));
      return {
        contribution: r.total,
        rollResult: r,
        kind: r.kind,
      };
    }
    case 'success': {
      const r = rollSuccess(spec.count, spec.sides, (value) => compare(value, spec.predicate));
      return {
        contribution: r.successCount,
        rollResult: r,
        kind: r.kind,
      };
    }
    case 'netSuccess': {
      const r = rollNetSuccess(
        spec.count,
        spec.sides,
        (value) => compare(value, spec.successPred),
        (value) => compare(value, spec.failurePred)
      );
      return {
        contribution: r.total,
        rollResult: r,
        kind: r.kind,
      };
    }
    case 'percentile': {
      const r = rollPercentile();
      return {
        contribution: r.result,
        rollResult: r,
        kind: r.kind,
      };
    }
    case 'fate': {
      const r = rollFate(spec.count);
      return {
        contribution: r.total,
        rollResult: r,
        kind: r.kind,
      };
    }
    default: {
      // Exhaustiveness check; unreachable if all kinds are handled
      const _: never = spec;
      return executeBlock(block, {
        kind: 'basic',
        count: 1,
        sides: 6,
      });
    }
  }
}

/**
 * 파싱된 항 목록을 실행하여 총계, 상세, 보정치 배열 생성
 */
export function evaluateTerms(
  expression: string,
  terms: ParsedTerm[]
): {
  total: number;
  rollDetails: DiceBlockRollDetail[];
  modifiers: ModifierEntry[];
} {
  const rollDetails: DiceBlockRollDetail[] = [];
  const modifiers: ModifierEntry[] = [];
  let total = 0;

  for (const term of terms) {
    if (term.type === 'modifier') {
      modifiers.push({
        sign: term.sign,
        value: term.value,
      });
      total += term.sign === '+'
        ? term.value
        : -term.value;
      continue;
    }

    const block = term.block;
    const spec = parseDiceBlockSpec(block);
    const { contribution, rollResult, kind, } = executeBlock(block, spec);

    rollDetails.push({
      block,
      kind,
      contribution: term.sign === '+'
        ? contribution
        : -contribution,
      rollResult,
    });
    total += term.sign === '+'
      ? contribution
      : -contribution;
  }

  return {
    total,
    rollDetails,
    modifiers,
  };
}
