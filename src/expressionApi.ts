import type { DiceExpressionResult } from './types';
import { evaluateTerms } from './utils/executeDiceBlocks';
import { parseTerms } from './utils/parseDiceBlocks';
import { splitExpressions } from './utils/parseDiceExpression';

/**
 * 주사위 표현식 문자열을 파싱하고 실행 (블록별 roll 함수 위임, 보정치 분리)
 * @param input 주사위 표현식 (예: "d20+5+4d20kl2+10d50ro1")
 * @returns 주사위식 실행 결과 배열 (expression, total, rollDetails, modifiers)
 */
export function rollDiceExpression(input: string): DiceExpressionResult[] {
  const expressions = splitExpressions(input);
  const results: DiceExpressionResult[] = [];

  for (const expr of expressions) {
    const terms = parseTerms(expr);
    const { total, rollDetails, modifiers, } = evaluateTerms(expr, terms);
    results.push({
      expression: expr,
      total,
      rollDetails,
      modifiers,
    });
  }

  return results;
}

/**
 * 주사위 표현식 문자열을 파싱만 수행 (실행하지 않음)
 * @param input 주사위 표현식 문자열
 * @returns 파싱된 표현식 문자열 배열
 */
export function parseDiceExpression(input: string): string[] {
  return splitExpressions(input);
}
