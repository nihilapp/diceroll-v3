# DiceRoll

주사위 표현식을 파싱하고 실행하는 TypeScript 라이브러리입니다. 다양한 주사위 굴림 방식을 지원하며, 블록별로 적절한 roll 함수에 위임하여 계산합니다.

A TypeScript library for parsing and executing dice expressions. Supports various dice rolling methods and delegates calculations to appropriate roll functions block by block.

## 설치 / Installation

```bash
# pnpm
pnpm add @nihilncunia/diceroll-v3

# npm
npm install @nihilncunia/diceroll-v3

# yarn
yarn add @nihilncunia/diceroll-v3
```

## 빠른 시작 / Quick Start

### ESM (import/export)

**한국어:** ES 모듈 형식으로 사용할 수 있습니다.

**English:** Can be used with ES module syntax.

```typescript
import { rollDiceExpression } from '@nihilncunia/diceroll-v3';

// 단일 주사위식
const result = rollDiceExpression('d20+5');
console.log(result);
// [
//   {
//     expression: 'D20+5',
//     total: 18,
//     rollDetails: [
//       { block: 'D20', kind: 'basic', contribution: 13, rollResult: {...} }
//     ],
//     modifiers: [{ sign: '+', value: 5 }]
//   }
// ]

// 여러 주사위식 (공백으로 구분)
const results = rollDiceExpression('d20+5 3d6+2');
console.log(results);
// [
//   { expression: 'D20+5', total: 18, rollDetails: [...], modifiers: [...] },
//   { expression: '3D6+2', total: 14, rollDetails: [...], modifiers: [...] }
// ]
```

### CommonJS (require/module.exports)

**한국어:** CommonJS 형식으로도 사용할 수 있습니다.

**English:** Can also be used with CommonJS syntax.

```javascript
const { rollDiceExpression } = require('@nihilncunia/diceroll-v3');

// 단일 주사위식
const result = rollDiceExpression('d20+5');
console.log(result);
// [
//   {
//     expression: 'D20+5',
//     total: 18,
//     rollDetails: [
//       { block: 'D20', kind: 'basic', contribution: 13, rollResult: {...} }
//     ],
//     modifiers: [{ sign: '+', value: 5 }]
//   }
// ]

// 여러 주사위식 (공백으로 구분)
const results = rollDiceExpression('d20+5 3d6+2');
console.log(results);
// [
//   { expression: 'D20+5', total: 18, rollDetails: [...], modifiers: [...] },
//   { expression: '3D6+2', total: 14, rollDetails: [...], modifiers: [...] }
// ]
```

## 지원하는 주사위식 / Supported Dice Expressions

### 기본 굴림 / Basic Roll

가장 기본적인 주사위 굴림입니다.

The most basic dice rolling.

```typescript
rollDiceExpression('d20');      // 1d20
rollDiceExpression('3d6');      // 3d6
rollDiceExpression('d20+5');    // 1d20 + 5
```

**한국어:** `d`, `D`, `ㅇ` 모두 동일하게 처리되며, 자동으로 `D`로 통일됩니다. 개수가 생략되면 1개로 간주됩니다.

**English:** `d`, `D`, `ㅇ` are all treated the same and automatically normalized to `D`. If the count is omitted, it defaults to 1.

### Compound (!!)

최대값이 나오면 추가 굴림 값을 기존 주사위 눈에 합쳐서 표시합니다.

When the maximum value is rolled, additional roll values are added to the original dice face.

```typescript
rollDiceExpression('10d6!!');     // 6이 나오면 다시 굴려서 기존 값에 더함
rollDiceExpression('1d4!!');      // 4가 나오면 계속 더해서 단일 숫자로 반환
rollDiceExpression('5d10!!>8');   // 9 이상일 때 compound
```

**한국어:** `!!` 접미사를 사용합니다. `!!>N` 형태로 임계값을 지정할 수 있습니다.

**English:** Use the `!!` suffix. You can specify a threshold with `!!>N` format.

### Explode (!)

특정 조건을 만족하면 추가 주사위를 굴립니다.

Rolls additional dice when certain conditions are met.

```typescript
rollDiceExpression('10d6!');      // 6이 나오면 주사위 추가
rollDiceExpression('5d10!>8');    // 9, 10이 나오면 주사위 추가
```

**한국어:** `!` 접미사를 사용합니다. `!>N` 형태로 임계값을 지정할 수 있습니다.

**English:** Use the `!` suffix. You can specify a threshold with `!>N` format.

### Keep Highest/Lowest (kh/kl)

여러 개의 주사위를 굴린 뒤, 상위/하위 N개만 선택해 합산합니다.

Roll multiple dice and select only the highest/lowest N dice to sum.

```typescript
rollDiceExpression('4d6kh3');    // 상위 3개만 선택 (D&D 능력치 생성)
rollDiceExpression('2d20kl1');    // 하위 1개만 선택 (Disadvantage)
rollDiceExpression('3d6kl1');     // 하위 1개만 선택
```

**한국어:** `khN`은 상위 N개, `klN`은 하위 N개를 유지합니다.

**English:** `khN` keeps the highest N dice, `klN` keeps the lowest N dice.

### Drop Highest/Lowest (dh/dl)

여러 개의 주사위를 굴린 뒤, 상위/하위 N개를 버리고 나머지만 합산합니다.

Roll multiple dice and drop the highest/lowest N dice, then sum the rest.

```typescript
rollDiceExpression('4d6dh1');    // 상위 1개를 버림
rollDiceExpression('4d6dl1');    // 하위 1개를 버림
rollDiceExpression('5d8dl2');    // 하위 2개를 버림
```

**한국어:** `dhN`은 상위 N개를 버리고, `dlN`은 하위 N개를 버립니다.

**English:** `dhN` drops the highest N dice, `dlN` drops the lowest N dice.

### Reroll (r)

조건을 만족하면 해당 눈이 아닐 때까지 계속 다시 굴립니다.

Keeps rerolling until the condition is not met.

```typescript
rollDiceExpression('1d20r1');      // 1이 나오면 1이 아닐 때까지 다시 굴림
rollDiceExpression('1d6r<=2');      // 1, 2가 나오면 3 이상 나올 때까지 다시 굴림
rollDiceExpression('2d10r<5');     // 4 이하가 나오면 5 이상 나올 때까지 다시 굴림
```

**한국어:** `rN`, `r<=N`, `r>=N`, `r<N`, `r>N` 형태로 조건을 지정할 수 있습니다.

**English:** You can specify conditions with `rN`, `r<=N`, `r>=N`, `r<N`, `r>N` formats.

### Reroll Once (ro)

조건을 만족하면 단 한 번만 다시 굴립니다.

Rerolls only once when the condition is met.

```typescript
rollDiceExpression('1d20ro1');     // 1이 나오면 한 번만 다시 굴림
rollDiceExpression('2d6ro<2');     // 1이 나오면 한 번만 다시 굴림
```

**한국어:** `roN`, `ro<=N`, `ro>=N`, `ro<N`, `ro>N` 형태로 조건을 지정할 수 있습니다.

**English:** You can specify conditions with `roN`, `ro<=N`, `ro>=N`, `ro<N`, `ro>N` formats.

### Success (>N, >=N, =N, <N)

성공 조건을 만족하는 주사위 개수만 카운트합니다 (WoD 등).

Counts only dice that meet the success condition (World of Darkness, etc.).

```typescript
rollDiceExpression('5d10>7');      // 7을 초과하는 주사위 개수
rollDiceExpression('3d6=6');       // 정확히 6인 주사위 개수
rollDiceExpression('4d8>=6');      // 6 이상인 주사위 개수
```

**한국어:** `>N`, `>=N`, `=N`, `<N`, `<=N` 형태로 성공 조건을 지정할 수 있습니다.

**English:** You can specify success conditions with `>N`, `>=N`, `=N`, `<N`, `<=N` formats.

### Net Success (>NfM)

성공(+1)·실패(-1)로 계산하여 순성공(합산)을 반환합니다 (WoD 등).

Calculates success (+1) and failure (-1) to return net success (World of Darkness, etc.).

```typescript
rollDiceExpression('5d10>8f1');        // 9, 10은 +1, 1은 -1
rollDiceExpression('6d6>4f<=2');       // 5, 6은 +1, 1, 2는 -1
rollDiceExpression('4d10>7f>=9');      // 8 이상은 +1, 9 이상은 -1
```

**한국어:** `>NfM` 형태로 성공 조건과 실패 조건을 지정합니다. 실패 조건도 `f<=N`, `f>=N`, `f<N`, `f>N` 형태로 지정할 수 있습니다.

**English:** Specify success and failure conditions with `>NfM` format. Failure conditions can also be specified as `f<=N`, `f>=N`, `f<N`, `f>N`.

### Percentile (d%)

퍼센타일 굴림 - 1~100 사이 난수 생성 (CoC 판정 등).

Percentile roll - generates a random number between 1~100 (Call of Cthulhu, etc.).

```typescript
rollDiceExpression('d%');          // 1~100 사이 난수
```

**한국어:** `d%` 또는 `D%` 형태로 사용합니다.

**English:** Use `d%` or `D%` format.

### Fate Dice (dF)

Fate 시스템용 주사위 굴림.

Dice rolling for the Fate system.

```typescript
rollDiceExpression('dF');          // 기본값 4dF
rollDiceExpression('4dF');         // 4dF
rollDiceExpression('1dF');         // 1dF
```

**한국어:** `dF` 또는 `DF` 형태로 사용합니다. 개수를 생략하면 기본값 4개로 굴립니다.

**English:** Use `dF` or `DF` format. If count is omitted, defaults to 4 dice.

## 복합 표현식 / Complex Expressions

### 보정치 / Modifiers

숫자로 보정치를 추가할 수 있습니다.

You can add modifiers as numbers.

```typescript
rollDiceExpression('d20+5');           // d20 + 5
rollDiceExpression('3d6+2-1');        // 3d6 + 2 - 1
rollDiceExpression('d20+5+4d6kl2');    // d20 + 5 + (4d6에서 하위 2개)
```

**한국어:** `+N` 또는 `-N` 형태로 보정치를 추가합니다. 보정치는 별도 배열로 분리되어 반환됩니다.

**English:** Add modifiers with `+N` or `-N` format. Modifiers are returned in a separate array.

### 여러 주사위식 / Multiple Expressions

공백으로 구분하여 여러 주사위식을 한 번에 실행할 수 있습니다.

You can execute multiple dice expressions at once, separated by spaces.

```typescript
rollDiceExpression('d20+5 d20+3d20');  // 두 개의 독립적인 주사위식
rollDiceExpression('d6 d8 d10');      // 세 개의 주사위식
```

**한국어:** 공백이 없으면 하나의 주사위식으로, 공백이 있으면 여러 주사위식으로 분리됩니다. 각 주사위식은 독립적으로 계산되어 배열로 반환됩니다.

**English:** If there's no space, it's treated as a single expression. If there are spaces, it's split into multiple expressions. Each expression is calculated independently and returned as an array.

### 괄호 우선순위 / Parentheses Priority

괄호를 사용하여 우선순위를 지정할 수 있습니다.

You can use parentheses to specify priority.

```typescript
rollDiceExpression('d20+(2d6+3)');     // d20 + (2d6 + 3)
rollDiceExpression('(3d6+2)*2');       // 괄호 내부 먼저 계산
```

**한국어:** 괄호 내부 표현식이 가장 최우선으로 평가됩니다.

**English:** Expressions inside parentheses are evaluated with highest priority.

## API 문서 / API Documentation

### `rollDiceExpression(input: string): DiceExpressionResult[]`

주사위 표현식 문자열을 파싱하고 실행합니다.

Parses and executes a dice expression string.

**Parameters / 매개변수:**
- `input`: 주사위 표현식 문자열 (예: `"d20+5+4d20kl2"`)

**Returns / 반환값:**

```typescript
type DiceExpressionResult = {
  /** 주사위식 원문 */
  expression: string;
  /** 총계 (모든 블록 contribution + 보정치 합) */
  total: number;
  /** 상세 주사위식별 굴림 정보 */
  rollDetails: DiceBlockRollDetail[];
  /** 보정치 배열 */
  modifiers: ModifierEntry[];
};
```

**한국어:** 각 주사위식마다 하나의 결과 객체가 생성되며, 여러 주사위식이면 배열로 반환됩니다.

**English:** One result object is created for each dice expression, and multiple expressions are returned as an array.

### `parseDiceExpression(input: string): string[]`

주사위 표현식 문자열을 파싱만 수행합니다 (실행하지 않음).

Only parses the dice expression string (does not execute).

**Parameters / 매개변수:**
- `input`: 주사위 표현식 문자열

**Returns / 반환값:**
- 파싱된 표현식 문자열 배열

**한국어:** 공백 기준으로 주사위식을 분리하여 배열로 반환합니다.

**English:** Splits dice expressions by spaces and returns them as an array.

## 예제 / Examples

### 기본 사용 / Basic Usage

```typescript
import { rollDiceExpression } from '@nihilncunia/diceroll-v3';

// D&D 스타일 굴림
const attack = rollDiceExpression('d20+5');
console.log(attack[0].total);  // 예: 18

// 능력치 생성 (4d6, 상위 3개)
const ability = rollDiceExpression('4d6kh3');
console.log(ability[0].total);  // 예: 15

// 불리함 (2d20, 하위 1개)
const disadvantage = rollDiceExpression('2d20kl1');
console.log(disadvantage[0].total);  // 예: 8
```

### 복합 표현식 / Complex Expressions

```typescript
// 여러 주사위와 보정치
const complex = rollDiceExpression('d20+5+4d20kl2+10d50ro1');
console.log(complex[0].total);
console.log(complex[0].rollDetails);  // 각 블록별 상세 정보
console.log(complex[0].modifiers);    // 보정치 배열

// 여러 주사위식
const multiple = rollDiceExpression('d20+5 d20+3d20');
console.log(multiple.length);  // 2
console.log(multiple[0].total);  // 첫 번째 주사위식 결과
console.log(multiple[1].total);  // 두 번째 주사위식 결과
```

### WoD 스타일 / World of Darkness Style

```typescript
// 성공 개수
const successes = rollDiceExpression('5d10>7');
console.log(successes[0].total);  // 성공 개수

// 순성공 (성공 - 실패)
const netSuccess = rollDiceExpression('5d10>8f1');
console.log(netSuccess[0].total);  // 순성공 (성공 개수 - 실패 개수)
```

## 개발 / Development

```bash
# 개발 모드 실행
pnpm dev

# 빌드
pnpm build

# 린트
pnpm lint
```

## 라이선스 / License

ISC
