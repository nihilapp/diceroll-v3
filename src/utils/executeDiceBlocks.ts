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
import type { DiceBlockRollDetail, ModifierEntry } from '../types';

import type { DiceBlockSpec, ParsedTerm } from './parseDiceBlocks';
import { parseDiceBlockSpec } from './parseDiceBlocks';

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
      const r = rollReroll(spec.count, spec.sides, spec.predicate);
      return {
        contribution: r.total,
        rollResult: r,
        kind: r.kind,
      };
    }
    case 'rerollOnce': {
      const r = rollRerollOnce(spec.count, spec.sides, spec.predicate);
      return {
        contribution: r.total,
        rollResult: r,
        kind: r.kind,
      };
    }
    case 'success': {
      const r = rollSuccess(spec.count, spec.sides, spec.predicate);
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
        spec.successPred,
        spec.failurePred
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
