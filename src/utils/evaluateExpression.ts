import { rollBasic } from '../roll/rollBasic';
import type { Token, ExpressionTermDetail } from '../types';

import { tokenize } from './parseDiceExpression';

/**
 * 괄호 내부 표현식을 재귀적으로 평가
 */
function evaluateSubexpression(tokens: Token[], startIndex: number): { result: number;
  endIndex: number;
  details: ExpressionTermDetail[]; } {
  const details: ExpressionTermDetail[] = [];
  let total = 0;
  let sign: '+' | '-' = '+';
  let i = startIndex;

  while (i < tokens.length) {
    const token = tokens[i];

    if (token.type === 'RIGHT_PAREN') {
      return {
        result: total,
        endIndex: i + 1,
        details,
      };
    }

    if (token.type === 'LEFT_PAREN') {
      const subResult = evaluateSubexpression(tokens, i + 1);
      const subValue = subResult.result;
      const subExpr = tokens.slice(i, subResult.endIndex).map((t) => {
        if (t.type === 'DICE') return `${t.count}D${t.sides}`;
        if (t.type === 'NUMBER') return String(t.value);
        if (t.type === 'PLUS') return '+';
        if (t.type === 'MINUS') return '-';
        return '';
      }).join('');

      details.push({
        type: 'subexpression',
        expression: subExpr,
        result: subValue,
        sign,
      });

      if (sign === '+') {
        total += subValue;
      }
      else {
        total -= subValue;
      }

      i = subResult.endIndex;
      sign = '+';
      continue;
    }

    if (token.type === 'PLUS') {
      sign = '+';
      i++;
      continue;
    }

    if (token.type === 'MINUS') {
      sign = '-';
      i++;
      continue;
    }

    if (token.type === 'DICE') {
      const rollResult = rollBasic(token.count, token.sides);
      const value = rollResult.total;

      details.push({
        type: 'dice',
        count: token.count,
        sides: token.sides,
        rollResult,
        sign,
      });

      if (sign === '+') {
        total += value;
      }
      else {
        total -= value;
      }

      i++;
      sign = '+';
      continue;
    }

    if (token.type === 'NUMBER') {
      const value = token.value;

      details.push({
        type: 'number',
        value,
        sign,
      });

      if (sign === '+') {
        total += value;
      }
      else {
        total -= value;
      }

      i++;
      sign = '+';
      continue;
    }

    i++;
  }

  return {
    result: total,
    endIndex: i,
    details,
  };
}

/**
 * 단일 주사위식을 평가
 */
export function evaluateExpression(expression: string): { total: number;
  details: ExpressionTermDetail[]; } {
  const tokens = tokenize(expression);

  // 괄호가 없으면 단순 평가
  if (!tokens.some((t) => t.type === 'LEFT_PAREN' || t.type === 'RIGHT_PAREN')) {
    const result = evaluateSubexpression(tokens, 0);
    return {
      total: result.result,
      details: result.details,
    };
  }

  // 괄호가 있으면 재귀 평가
  const result = evaluateSubexpression(tokens, 0);
  return {
    total: result.result,
    details: result.details,
  };
}
