# FVTT Dice Compatibility Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 기존 고유 문법을 유지하면서 FVTT 스타일 modifier 조합 파싱과 실행을 지원한다.

**Architecture:** 주사위 블록을 단일 kind가 아니라 `base dice term + ordered modifiers[]`로 모델링한다. 파서는 블록 본체와 modifier 스트림을 분리하고, 실행기는 intermediate result에 modifier를 고정 순서로 적용한다.

**Tech Stack:** TypeScript, tsup, eslint, 기존 `src/roll` 함수군, 신규 테스트 러너

---

## 파일 구조

**Create**

- `docs/superpowers/specs/2026-06-28-fvtt-dice-compat-design.md`
- `tests/parser/parseDiceModifiers.test.ts`
- `tests/parser/parseDiceTermSpec.test.ts`
- `tests/compat/fvtt-reroll.test.ts`
- `tests/compat/fvtt-explode.test.ts`
- `tests/compat/fvtt-success.test.ts`
- `tests/compat/project-extension.test.ts`
- `tests/regression/readme-supported-syntax.test.ts`
- `src/utils/parseDiceModifiers.ts`
- `src/utils/diceModifierTypes.ts`
- `src/utils/diceCompatibility.ts`
- `src/utils/applyDiceModifiers.ts`
- `src/roll/rollExplodeOnce.ts`
- `src/roll/rollCountFailures.ts`
- `src/roll/rollDeductFailures.ts`
- `src/roll/rollSubtractFailureFaces.ts`
- `src/roll/rollMarginSuccess.ts`

**Modify**

- `package.json`
- `src/types.ts`
- `src/index.ts`
- `src/utils/parseDiceBlocks.ts`
- `src/utils/executeDiceBlocks.ts`
- `src/roll/rollReroll.ts`
- `src/roll/rollRerollOnce.ts`
- `src/roll/rollExplode.ts`
- `README.md`
- `src/examples/index.example.ts`

### Task 1: 테스트 인프라 추가

**Files:**
- Modify: `package.json`
- Create: `tests/parser/parseDiceModifiers.test.ts`

- [ ] **Step 1: 테스트 러너를 선택하고 스크립트 추가**

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "devDependencies": {
    "vitest": "^3.2.4"
  }
}
```

- [ ] **Step 2: 파서 실패 테스트 작성**

```ts
import { describe, expect, it } from 'vitest';
import { parseDiceModifiers } from '../../src/utils/parseDiceModifiers';

describe('parseDiceModifiers', () => {
  it('parses rr, kh, x in one suffix stream', () => {
    expect(parseDiceModifiers('rr1kh3x', 6)).toEqual([
      { kind: 'rerollRecursive', predicate: { op: '=', value: 1 }, source: 'fvtt-rr' },
      { kind: 'keepHighest', count: 3 },
      { kind: 'explode', source: 'fvtt-x' },
    ]);
  });
});
```

- [ ] **Step 3: 테스트 실행으로 실패 확인**

Run: `pnpm test`
Expected: FAIL with module not found or export not found for `parseDiceModifiers`

- [ ] **Step 4: Commit**

```bash
git add package.json pnpm-lock.yaml tests/parser/parseDiceModifiers.test.ts
git commit -m "2026 0628 test: FVTT 파서 테스트 기반 추가"
```

### Task 2: modifier 타입과 호환 정책 정의

**Files:**
- Create: `src/utils/diceModifierTypes.ts`
- Create: `src/utils/diceCompatibility.ts`
- Modify: `src/types.ts`
- Test: `tests/parser/parseDiceTermSpec.test.ts`

- [ ] **Step 1: 타입 정의 테스트 작성**

```ts
import { describe, expect, it } from 'vitest';
import { parseDiceBlockSpec } from '../../src/utils/parseDiceBlocks';

describe('parseDiceBlockSpec', () => {
  it('returns base plus ordered modifiers', () => {
    const spec = parseDiceBlockSpec('4D6rr1kh3');
    expect(spec).toMatchObject({
      count: 4,
      sides: 6,
      modifiers: [
        { kind: 'rerollRecursive' },
        { kind: 'keepHighest', count: 3 },
      ],
    });
  });
});
```

- [ ] **Step 2: 최소 타입 정의 추가**

```ts
export type ComparisonOperator = '=' | '>' | '>=' | '<' | '<=';

export type ComparisonPredicate = {
  op: ComparisonOperator;
  value: number;
};

export type DiceModifierSpec =
  | { kind: 'rerollOnce'; predicate: ComparisonPredicate; source: 'fvtt-r' }
  | { kind: 'rerollRecursive'; predicate: ComparisonPredicate; source: 'fvtt-rr' }
  | { kind: 'explode'; predicate?: ComparisonPredicate; source: 'bang' | 'fvtt-x' }
  | { kind: 'explodeOnce'; predicate?: ComparisonPredicate; source: 'fvtt-xo' }
  | { kind: 'compound'; predicate?: ComparisonPredicate; source: 'bang-bang' }
  | { kind: 'keepHighest'; count: number };
```

- [ ] **Step 3: 호환 정책 표 정의**

```ts
export const compatibilityPolicy = {
  reroll: {
    r: 'rerollOnce',
    rr: 'rerollRecursive',
    ro: 'removed',
  },
  explode: {
    '!': 'explode',
    '!!': 'compound',
    x: 'explode',
    xo: 'explodeOnce',
  },
} as const;
```

- [ ] **Step 4: 테스트 실행**

Run: `pnpm test`
Expected: parser shape tests still fail, but type import errors are gone

- [ ] **Step 5: Commit**

```bash
git add src/utils/diceModifierTypes.ts src/utils/diceCompatibility.ts src/types.ts tests/parser/parseDiceTermSpec.test.ts
git commit -m "2026 0628 feat: FVTT modifier 타입과 호환 정책 정의"
```

### Task 3: suffix 조합 파서 구현

**Files:**
- Create: `src/utils/parseDiceModifiers.ts`
- Modify: `src/utils/parseDiceBlocks.ts`
- Test: `tests/parser/parseDiceModifiers.test.ts`
- Test: `tests/parser/parseDiceTermSpec.test.ts`

- [ ] **Step 1: modifier 조합 테스트 확장**

```ts
it('parses r as reroll once and rr as recursive reroll', () => {
  expect(parseDiceModifiers('r1rr<3', 6)).toEqual([
    { kind: 'rerollOnce', predicate: { op: '=', value: 1 }, source: 'fvtt-r' },
    { kind: 'rerollRecursive', predicate: { op: '<', value: 3 }, source: 'fvtt-rr' },
  ]);
});

it('rejects removed ro syntax', () => {
  expect(() => parseDiceModifiers('ro1', 6)).toThrow(/ro/);
});
```

- [ ] **Step 2: 조합 파서 최소 구현**

```ts
export function parseDiceModifiers(input: string, sides: number): DiceModifierSpec[] {
  const modifiers: DiceModifierSpec[] = [];
  let rest = input;

  while (rest.length > 0) {
    const next = readOneModifier(rest, sides);
    if (!next) throw new Error(`Unsupported modifier sequence: ${rest}`);
    modifiers.push(next.modifier);
    rest = rest.slice(next.length);
  }

  return modifiers;
}
```

- [ ] **Step 3: `parseDiceBlockSpec()`를 배열 기반으로 변경**

```ts
const suffix = (mainMatch[3] || '').toLowerCase();
const modifiers = parseDiceModifiers(suffix, sides);
return {
  notation: b,
  family: 'standard',
  count,
  sides,
  modifiers,
};
```

- [ ] **Step 4: 테스트 실행**

Run: `pnpm test`
Expected: parser tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/utils/parseDiceModifiers.ts src/utils/parseDiceBlocks.ts tests/parser/parseDiceModifiers.test.ts tests/parser/parseDiceTermSpec.test.ts
git commit -m "2026 0628 feat: modifier 조합 파서 도입"
```

### Task 4: intermediate result 실행기 도입

**Files:**
- Create: `src/utils/applyDiceModifiers.ts`
- Modify: `src/utils/executeDiceBlocks.ts`
- Modify: `src/types.ts`

- [ ] **Step 1: 실행기 회귀 테스트 작성**

```ts
import { describe, expect, it } from 'vitest';
import { rollDiceExpression } from '../../src/expressionApi';

describe('reroll compatibility', () => {
  it('accepts rr and kh in same block', () => {
    const [result] = rollDiceExpression('4d6rr1kh3');
    expect(result.rollDetails[0].block).toBe('4D6rr1kh3');
    expect(result.rollDetails[0].kind).toBe('keepHighest');
  });
});
```

- [ ] **Step 2: intermediate result 타입 추가**

```ts
export type MutableDiceTermResult = {
  minNumber: number;
  maxNumber: number;
  rolls: DiceRollResult[];
  mode: 'sum' | 'successCount' | 'netSuccess' | 'marginSuccess';
  total: number;
};
```

- [ ] **Step 3: modifier 적용기 구현**

```ts
export function applyDiceModifiers(
  base: MutableDiceTermResult,
  modifiers: DiceModifierSpec[]
): RollResult {
  let current = base;
  for (const modifier of sortModifiersForExecution(modifiers)) {
    current = applySingleModifier(current, modifier);
  }
  return finalizeRollResult(current, modifiers);
}
```

- [ ] **Step 4: `executeBlock()` 연동**

```ts
const base = rollBaseDiceTerm(spec);
const result = applyDiceModifiers(base, spec.modifiers);
return {
  contribution: extractContribution(result),
  rollResult: result,
  kind: inferPrimaryKind(result, spec.modifiers),
};
```

- [ ] **Step 5: 테스트 실행**

Run: `pnpm test`
Expected: parser tests continue to pass, reroll compatibility test may still fail until Task 5

- [ ] **Step 6: Commit**

```bash
git add src/utils/applyDiceModifiers.ts src/utils/executeDiceBlocks.ts src/types.ts tests/compat/fvtt-reroll.test.ts
git commit -m "2026 0628 refactor: modifier 순차 실행기 도입"
```

### Task 5: reroll 의미 재정의와 `ro` 제거

**Files:**
- Modify: `src/roll/rollReroll.ts`
- Modify: `src/roll/rollRerollOnce.ts`
- Modify: `src/utils/parseDiceModifiers.ts`
- Test: `tests/compat/fvtt-reroll.test.ts`

- [ ] **Step 1: reroll 의미 테스트 구체화**

```ts
it('maps r to reroll once', () => {
  const spec = parseDiceBlockSpec('1D6r1');
  expect(spec?.modifiers[0]).toMatchObject({ kind: 'rerollOnce', source: 'fvtt-r' });
});

it('maps rr to recursive reroll', () => {
  const spec = parseDiceBlockSpec('1D6rr1');
  expect(spec?.modifiers[0]).toMatchObject({ kind: 'rerollRecursive', source: 'fvtt-rr' });
});
```

- [ ] **Step 2: parser에서 `ro`를 명시적으로 거부**

```ts
if (rest.startsWith('ro')) {
  throw new Error('Modifier ro is removed. Use r or rr.');
}
```

- [ ] **Step 3: 함수 의미와 이름 정리**

```ts
export function rollRerollOnce(...) { /* FVTT r */ }
export function rollReroll(...) { /* FVTT rr */ }
```

- [ ] **Step 4: 테스트 실행**

Run: `pnpm test -- tests/compat/fvtt-reroll.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/roll/rollReroll.ts src/roll/rollRerollOnce.ts src/utils/parseDiceModifiers.ts tests/compat/fvtt-reroll.test.ts
git commit -m "2026 0628 feat: FVTT 기준 reroll 의미 재정의"
```

### Task 6: explode 호환 추가

**Files:**
- Create: `src/roll/rollExplodeOnce.ts`
- Modify: `src/roll/rollExplode.ts`
- Modify: `src/utils/parseDiceModifiers.ts`
- Test: `tests/compat/fvtt-explode.test.ts`

- [ ] **Step 1: explode 호환 테스트 작성**

```ts
it('supports x and xo alongside ! and !!', () => {
  expect(parseDiceBlockSpec('2D6x')?.modifiers[0]).toMatchObject({ kind: 'explode', source: 'fvtt-x' });
  expect(parseDiceBlockSpec('2D6xo')?.modifiers[0]).toMatchObject({ kind: 'explodeOnce', source: 'fvtt-xo' });
  expect(parseDiceBlockSpec('2D6!')?.modifiers[0]).toMatchObject({ kind: 'explode', source: 'bang' });
  expect(parseDiceBlockSpec('2D6!!')?.modifiers[0]).toMatchObject({ kind: 'compound', source: 'bang-bang' });
});
```

- [ ] **Step 2: `xo` 전용 롤러 구현**

```ts
export function rollExplodeOnce(
  count: number,
  maxNumber: number,
  threshold: number = maxNumber
): RollExplodeResult {
  // each die explodes at most once
}
```

- [ ] **Step 3: parser와 실행기 연결**

```ts
if (rest.startsWith('xo')) return ...
if (rest.startsWith('x')) return ...
if (rest.startsWith('!!')) return ...
if (rest.startsWith('!')) return ...
```

- [ ] **Step 4: 테스트 실행**

Run: `pnpm test -- tests/compat/fvtt-explode.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/roll/rollExplode.ts src/roll/rollExplodeOnce.ts src/utils/parseDiceModifiers.ts tests/compat/fvtt-explode.test.ts
git commit -m "2026 0628 feat: explode 문법 병행 지원"
```

### Task 7: success/failure 계열 확장

**Files:**
- Create: `src/roll/rollCountFailures.ts`
- Create: `src/roll/rollDeductFailures.ts`
- Create: `src/roll/rollSubtractFailureFaces.ts`
- Create: `src/roll/rollMarginSuccess.ts`
- Modify: `src/utils/parseDiceModifiers.ts`
- Modify: `src/utils/applyDiceModifiers.ts`
- Test: `tests/compat/fvtt-success.test.ts`

- [ ] **Step 1: success 계열 파싱 테스트 작성**

```ts
it('parses cs, cf, df, sf, ms modifiers', () => {
  const spec = parseDiceBlockSpec('5D10cs>=8cf=1df=1');
  expect(spec?.modifiers.map((m) => m.kind)).toEqual([
    'countSuccess',
    'countFailure',
    'deductFailures',
  ]);
});
```

- [ ] **Step 2: 최소 함수 구현**

```ts
export function rollDeductFailures(rolls: DiceRollResult[], success: ComparisonPredicate, failure: ComparisonPredicate) {
  const successCount = rolls.filter((r) => compare(r.result, success)).length;
  const failureCount = rolls.filter((r) => compare(r.result, failure)).length;
  return successCount - failureCount;
}
```

- [ ] **Step 3: `>NfM`와 FVTT success 계열 충돌 차단**

```ts
if (hasNetSuccess(modifiers) && hasFvttSuccessFamily(modifiers)) {
  throw new Error('Cannot combine >NfM with FVTT success-family modifiers.');
}
```

- [ ] **Step 4: 테스트 실행**

Run: `pnpm test -- tests/compat/fvtt-success.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/roll/rollCountFailures.ts src/roll/rollDeductFailures.ts src/roll/rollSubtractFailureFaces.ts src/roll/rollMarginSuccess.ts src/utils/parseDiceModifiers.ts src/utils/applyDiceModifiers.ts tests/compat/fvtt-success.test.ts
git commit -m "2026 0628 feat: FVTT success 계열 modifier 추가"
```

### Task 8: min/max/even/odd와 keep-drop 조합

**Files:**
- Modify: `src/utils/parseDiceModifiers.ts`
- Modify: `src/utils/applyDiceModifiers.ts`
- Test: `tests/compat/project-extension.test.ts`

- [ ] **Step 1: 조합 회귀 테스트 작성**

```ts
it('supports min, rr, kh in one block', () => {
  const spec = parseDiceBlockSpec('4D6min2rr1kh3');
  expect(spec?.modifiers.map((m) => m.kind)).toEqual([
    'minimum',
    'rerollRecursive',
    'keepHighest',
  ]);
});
```

- [ ] **Step 2: parser와 적용기 확장**

```ts
if (rest.startsWith('min')) return ...
if (rest.startsWith('max')) return ...
if (rest.startsWith('even')) return ...
if (rest.startsWith('odd')) return ...
```

- [ ] **Step 3: 실행 순서 고정**

```ts
const executionOrder = [
  'minimum',
  'maximum',
  'rerollOnce',
  'rerollRecursive',
  'explode',
  'explodeOnce',
  'compound',
  'keepHighest',
  'keepLowest',
  'dropHighest',
  'dropLowest',
  'countSuccess',
  'countFailure',
  'deductFailures',
  'subtractFailureFaces',
  'marginSuccess',
];
```

- [ ] **Step 4: 테스트 실행**

Run: `pnpm test -- tests/compat/project-extension.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/utils/parseDiceModifiers.ts src/utils/applyDiceModifiers.ts tests/compat/project-extension.test.ts
git commit -m "2026 0628 feat: modifier 조합 실행 순서 확정"
```

### Task 9: 공개 API, 문서, 예제 정렬

**Files:**
- Modify: `src/index.ts`
- Modify: `README.md`
- Modify: `src/examples/index.example.ts`
- Test: `tests/regression/readme-supported-syntax.test.ts`

- [ ] **Step 1: README 회귀 테스트 작성**

```ts
it('keeps documented reroll and explode syntax in sync', () => {
  expect(() => rollDiceExpression('1d6r1')).not.toThrow();
  expect(() => rollDiceExpression('1d6rr1')).not.toThrow();
  expect(() => rollDiceExpression('1d6x')).not.toThrow();
  expect(() => rollDiceExpression('1d6xo')).not.toThrow();
  expect(() => rollDiceExpression('1d6ro1')).toThrow();
});
```

- [ ] **Step 2: export 정리**

```ts
export { rollExplodeOnce } from './roll/rollExplodeOnce';
export { rollCountFailures } from './roll/rollCountFailures';
export { rollDeductFailures } from './roll/rollDeductFailures';
export { rollSubtractFailureFaces } from './roll/rollSubtractFailureFaces';
export { rollMarginSuccess } from './roll/rollMarginSuccess';
```

- [ ] **Step 3: README 지원 문법표 수정**

```md
- FVTT 호환: `r`, `rr`, `x`, `xo`, `cs`, `cf`, `df`, `sf`, `ms`, `min`, `max`
- 프로젝트 확장: `!`, `!!`, `>NfM`, `ㅇ`
- 제거됨: `ro`
```

- [ ] **Step 4: 전체 테스트 실행**

Run: `pnpm test`
Expected: PASS

- [ ] **Step 5: 린트 실행**

Run: `pnpm lint`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/index.ts README.md src/examples/index.example.ts tests/regression/readme-supported-syntax.test.ts
git commit -m "2026 0628 docs: FVTT 호환 문법과 예제 정렬"
```
