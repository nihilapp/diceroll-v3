import { normalizeDiceSymbols } from './parseDiceExpression';

/** 파싱된 항: 보정치(숫자) 또는 주사위 블록 */
export type ParsedTerm
  = | { type: 'modifier';
    sign: '+' | '-';
    value: number; }
    | { type: 'diceBlock';
      sign: '+' | '-';
      block: string; };

/**
 * 표현식을 + / - 기준으로 항으로 쪼개고, 각 항을 보정치 또는 주사위 블록으로 분류
 */
export function parseTerms(expression: string): ParsedTerm[] {
  const normalized = normalizeDiceSymbols(expression.trim());
  const terms: ParsedTerm[] = [];
  let i = 0;
  let sign: '+' | '-' = '+';

  while (i < normalized.length) {
    if (normalized[i] === '+') {
      sign = '+';
      i++;
      continue;
    }
    if (normalized[i] === '-') {
      sign = '-';
      i++;
      continue;
    }
    if (/\s/.test(normalized[i])) {
      i++;
      continue;
    }

    // D로 시작하는 주사위 블록 (개수 없음: D20, D%, DF 등)
    if (normalized[i] === 'D') {
      const block = readOneDiceBlock(normalized, i);
      i = block.endIndex;
      terms.push({
        type: 'diceBlock',
        sign,
        block: block.block,
      });
      sign = '+';
      continue;
    }

    // 숫자로 시작하면: 끝까지 읽어서 뒤에 D가 붙는지 확인
    if (/\d/.test(normalized[i])) {
      const start = i;
      while (i < normalized.length && /\d/.test(normalized[i])) {
        i++;
      }
      const numStr = normalized.slice(start, i);

      // 바로 뒤가 D면 주사위 블록의 일부 (개수). 블록 전체를 읽어야 함
      if (i < normalized.length && normalized[i] === 'D') {
        // 주사위 블록: "3D20kl2" 형태. 숫자 + D + ... 를 한 덩어리로
        i = start; // 다시 처음부터 (개수 포함)
        const block = readOneDiceBlock(normalized, i);
        i = block.endIndex;
        terms.push({
          type: 'diceBlock',
          sign,
          block: block.block,
        });
        sign = '+';
        continue;
      }

      // 순수 숫자 → 보정치 (i는 이미 숫자 끝으로 진행됨)
      const value = parseInt(numStr, 10);
      if (!isNaN(value)) {
        terms.push({
          type: 'modifier',
          sign,
          value,
        });
      }
      sign = '+';
      continue;
    }

    i++;
  }

  return terms;
}

/**
 * 현재 위치에서 주사위 블록 하나를 읽음 (D20, D20kl2, D%, 4DF 등)
 */
function readOneDiceBlock(expr: string, start: number): { block: string;
  endIndex: number; } {
  let i = start;

  // 개수 (선택)
  while (i < expr.length && /\d/.test(expr[i])) {
    i++;
  }

  if (i >= expr.length || expr[i] !== 'D') {
    return {
      block: '',
      endIndex: start,
    };
  }
  i++; // D 건너뛰기

  // D% 퍼센타일
  if (expr[i] === '%') {
    return {
      block: expr.slice(start, i + 1),
      endIndex: i + 1,
    };
  }

  // DF 또는 Df 페이트
  if (expr[i] === 'F' || expr[i] === 'f') {
    return {
      block: expr.slice(start, i + 1),
      endIndex: i + 1,
    };
  }

  // 면수 숫자
  if (!/\d/.test(expr[i])) {
    return {
      block: expr.slice(start, i),
      endIndex: i,
    };
  }
  while (i < expr.length && /\d/.test(expr[i])) {
    i++;
  }

  // 접미사: kl, kh, dh, dl, !, !!, r, ro, >N, >NfM 등
  while (i < expr.length) {
    const rest = expr.slice(i);
    // 2글자 이상 접미사 우선
    if (/^kl\d+/.test(rest) || /^kh\d+/.test(rest) || /^dh\d+/.test(rest) || /^dl\d+/.test(rest)) {
      const match = rest.match(/^(kl|kh|dh|dl)(\d+)/);
      if (match) {
        i += match[0].length;
        continue;
      }
    }
    if (/^!!>?\d*/.test(rest)) {
      const match = rest.match(/^!!>?(\d*)/);
      if (match) {
        i += match[0].length;
        continue;
      }
    }
    if (/^!>?\d*/.test(rest)) {
      const match = rest.match(/^!>?(\d*)/);
      if (match) {
        i += match[0].length;
        continue;
      }
    }
    if (/^ro[<=>]*\d+/.test(rest)) {
      const match = rest.match(/^ro([<=>]*)(\d+)/);
      if (match) {
        i += match[0].length;
        continue;
      }
    }
    if (/^r[<=>]*\d+/.test(rest)) {
      const match = rest.match(/^r([<=>]*)(\d+)/);
      if (match) {
        i += match[0].length;
        continue;
      }
    }
    // >8f1, >8f<=2 등
    if (/^>\d+f[<=>]*\d+/.test(rest)) {
      const match = rest.match(/^>(\d+)f([<=>]*)(\d+)/);
      if (match) {
        i += match[0].length;
        continue;
      }
    }
    // >7, >=8, =6, <3
    if (/^[>=<]+\d+/.test(rest)) {
      const match = rest.match(/^([>=<]+)(\d+)/);
      if (match) {
        i += match[0].length;
        continue;
      }
    }
    break;
  }

  return {
    block: expr.slice(start, i),
    endIndex: i,
  };
}

/** 블록 스펙: 어떤 roll 함수를 어떤 인자로 호출할지 */
export type DiceBlockSpec
  = | { kind: 'basic';
    count: number;
    sides: number; }
    | { kind: 'compound';
      count: number;
      sides: number;
      threshold?: number; }
      | { kind: 'explode';
        count: number;
        sides: number;
        threshold?: number; }
        | { kind: 'keepHighest';
          count: number;
          sides: number;
          keep: number; }
          | { kind: 'keepLowest';
            count: number;
            sides: number;
            keep: number; }
            | { kind: 'dropHighest';
              count: number;
              sides: number;
              drop: number; }
              | { kind: 'dropLowest';
                count: number;
                sides: number;
                drop: number; }
                | { kind: 'reroll';
                  count: number;
                  sides: number;
                  predicate: (r: number) => boolean; }
                  | { kind: 'rerollOnce';
                    count: number;
                    sides: number;
                    predicate: (r: number) => boolean; }
                    | { kind: 'success';
                      count: number;
                      sides: number;
                      predicate: (r: number) => boolean; }
                      | { kind: 'netSuccess';
                        count: number;
                        sides: number;
                        successPred: (r: number) => boolean;
                        failurePred: (r: number) => boolean; }
                        | { kind: 'percentile' }
                        | { kind: 'fate';
                          count: number; };

/**
 * 주사위 블록 문자열을 스펙으로 파싱
 */
export function parseDiceBlockSpec(block: string): DiceBlockSpec | null {
  const b = block.trim();
  if (!b.length) return null;

  // D%
  if (/^(\d*)D%$/i.test(b)) {
    return { kind: 'percentile', };
  }

  // NdF or dF
  const fateMatch = b.match(/^(\d*)D[Ff]$/i);
  if (fateMatch) {
    const count = fateMatch[1]
      ? parseInt(fateMatch[1], 10)
      : 4;
    return {
      kind: 'fate',
      count: count || 4,
    };
  }

  // NdN + suffix
  const mainMatch = b.match(/^(\d*)D(\d+)(.*)$/i);
  if (!mainMatch) return null;

  const count = mainMatch[1]
    ? parseInt(mainMatch[1], 10)
    : 1;
  const sides = parseInt(mainMatch[2], 10);
  const suffix = (mainMatch[3] || '').toLowerCase();

  if (suffix === '') {
    return {
      kind: 'basic',
      count,
      sides,
    };
  }

  const khMatch = suffix.match(/^kh(\d+)$/);
  if (khMatch) {
    return {
      kind: 'keepHighest',
      count,
      sides,
      keep: parseInt(khMatch[1], 10),
    };
  }
  const klMatch = suffix.match(/^kl(\d+)$/);
  if (klMatch) {
    return {
      kind: 'keepLowest',
      count,
      sides,
      keep: parseInt(klMatch[1], 10),
    };
  }
  const dhMatch = suffix.match(/^dh(\d+)$/);
  if (dhMatch) {
    return {
      kind: 'dropHighest',
      count,
      sides,
      drop: parseInt(dhMatch[1], 10),
    };
  }
  const dlMatch = suffix.match(/^dl(\d+)$/);
  if (dlMatch) {
    return {
      kind: 'dropLowest',
      count,
      sides,
      drop: parseInt(dlMatch[1], 10),
    };
  }

  if (/^!!>?(\d*)$/.test(suffix)) {
    const t = suffix.match(/^!!>?(\d*)$/);
    const threshold = t && t[1]
      ? parseInt(t[1], 10)
      : sides;
    return {
      kind: 'compound',
      count,
      sides,
      threshold,
    };
  }
  if (/^!>?(\d*)$/.test(suffix)) {
    const t = suffix.match(/^!>?(\d*)$/);
    const threshold = t && t[1]
      ? parseInt(t[1], 10)
      : sides;
    return {
      kind: 'explode',
      count,
      sides,
      threshold,
    };
  }

  const roMatch = suffix.match(/^ro([<=>]*)(\d+)$/);
  if (roMatch) {
    const pred = makePredicate(roMatch[1], parseInt(roMatch[2], 10));
    return {
      kind: 'rerollOnce',
      count,
      sides,
      predicate: pred,
    };
  }
  const rMatch = suffix.match(/^r([<=>]*)(\d+)$/);
  if (rMatch) {
    const pred = makePredicate(rMatch[1], parseInt(rMatch[2], 10));
    return {
      kind: 'reroll',
      count,
      sides,
      predicate: pred,
    };
  }

  const netMatch = suffix.match(/^>(\d+)f([<=>]*)(\d+)$/);
  if (netMatch) {
    const successN = parseInt(netMatch[1], 10);
    const failureN = parseInt(netMatch[3], 10);
    const failOp = netMatch[2] || '=';
    return {
      kind: 'netSuccess',
      count,
      sides,
      successPred: (r: number) => r > successN,
      failurePred: makePredicate(failOp, failureN),
    };
  }

  const succMatch = suffix.match(/^([>=<]+)(\d+)$/);
  if (succMatch) {
    const pred = makePredicate(succMatch[1], parseInt(succMatch[2], 10));
    return {
      kind: 'success',
      count,
      sides,
      predicate: pred,
    };
  }

  return {
    kind: 'basic',
    count,
    sides,
  };
}

function makePredicate(op: string, n: number): (r: number) => boolean {
  if (op === '' || op === '=') return (r: number) => r === n;
  if (op === '>') return (r: number) => r > n;
  if (op === '>=') return (r: number) => r >= n;
  if (op === '<') return (r: number) => r < n;
  if (op === '<=') return (r: number) => r <= n;
  return (r: number) => r === n;
}
