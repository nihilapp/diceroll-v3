import type { Token } from '../types';

/**
 * 다이스 기호 통일: D, d, ㅇ 모두 D로 변환
 */
export function normalizeDiceSymbols(input: string): string {
  return input.replace(/[Ddㅇ]/g, 'D');
}

/**
 * 공백 기준으로 주사위식을 분리
 * 공백이 없으면 하나의 주사위식, 공백이 있으면 여러 개로 분리
 */
export function splitExpressions(input: string): string[] {
  const normalized = normalizeDiceSymbols(input.trim());
  if (!normalized.includes(' ')) {
    return [ normalized, ];
  }
  return normalized.split(/\s+/).filter((expr) => expr.length > 0);
}

/**
 * 문자열을 토큰으로 변환하는 스캐너
 */
export function tokenize(expression: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const len = expression.length;

  while (i < len) {
    // 공백 건너뛰기
    if (/\s/.test(expression[i])) {
      i++;
      continue;
    }

    // 플러스
    if (expression[i] === '+') {
      tokens.push({ type: 'PLUS', });
      i++;
      continue;
    }

    // 마이너스
    if (expression[i] === '-') {
      tokens.push({ type: 'MINUS', });
      i++;
      continue;
    }

    // 왼쪽 괄호
    if (expression[i] === '(') {
      tokens.push({ type: 'LEFT_PAREN', });
      i++;
      continue;
    }

    // 오른쪽 괄호
    if (expression[i] === ')') {
      tokens.push({ type: 'RIGHT_PAREN', });
      i++;
      continue;
    }

    // 주사위 패턴: (\d*)D(\d+)
    if (expression[i] === 'D') {
      // 앞의 개수 파싱 (없으면 1)
      let count = 1;
      let countStart = i - 1;
      while (countStart >= 0 && /\d/.test(expression[countStart])) {
        countStart--;
      }
      if (countStart < i - 1) {
        const countStr = expression.slice(countStart + 1, i);
        const parsedCount = parseInt(countStr, 10);
        if (!isNaN(parsedCount) && parsedCount > 0) {
          count = parsedCount;
        }
      }

      // 면수 파싱
      i++; // D 건너뛰기
      const sidesStart = i;
      while (i < len && /\d/.test(expression[i])) {
        i++;
      }
      const sidesStr = expression.slice(sidesStart, i);
      const sides = parseInt(sidesStr, 10);

      if (isNaN(sides) || sides <= 0) {
        throw new Error(`Invalid dice sides at position ${sidesStart}`);
      }

      tokens.push({
        type: 'DICE',
        count,
        sides,
      });
      continue;
    }

    // 숫자 패턴: \d+
    // 단, 바로 뒤에 D가 오면 주사위 개수이므로 NUMBER로 파싱하지 않음
    if (/\d/.test(expression[i])) {
      const numStart = i;
      let numEnd = i;
      while (numEnd < len && /\d/.test(expression[numEnd])) {
        numEnd++;
      }

      // 바로 뒤에 D가 오는지 확인
      if (numEnd < len && expression[numEnd] === 'D') {
        // 주사위 개수이므로 여기서 처리하지 않고 D를 만날 때 처리
        i = numEnd;
        continue;
      }

      // 일반 숫자로 파싱
      const numStr = expression.slice(numStart, numEnd);
      const value = parseInt(numStr, 10);

      if (isNaN(value)) {
        throw new Error(`Invalid number at position ${numStart}`);
      }

      tokens.push({
        type: 'NUMBER',
        value,
      });
      i = numEnd;
      continue;
    }

    // 알 수 없는 문자
    throw new Error(`Unexpected character '${expression[i]}' at position ${i}`);
  }

  return tokens;
}
