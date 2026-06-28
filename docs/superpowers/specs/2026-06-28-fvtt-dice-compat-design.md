# FVTT 주사위식 호환 확장 설계

**목표**

이 프로젝트의 기존 고유 기능인 `!!`, `>NfM`, `ㅇ -> D`, 공백 분리 다중식을 유지하면서, Foundry VTT 스타일 modifier를 같은 주사위 블록 안에서 조합해 사용할 수 있도록 파서와 실행 모델을 재구성한다. 특히 `r`와 `rr`은 FVTT 의미로 재정의하고, `ro`는 제거한다.

## 요구사항 요약

- FVTT 스타일 재굴림 의미 적용
  - `r`: 1회 재굴림
  - `rr`: 조건 불일치까지 반복 재굴림
- explode 문법 병행
  - 프로젝트 확장: `!`, `!!`
  - FVTT 호환: `x`, `xo`
- modifier 조합 지원
  - 예: `4d6rr1kh3`
  - 예: `5d10xcs>=8`
  - 예: `8d6min2rr<2kh5`
- 프로젝트 고유 기능 유지
  - `!!`
  - `>NfM`
  - `ㅇ` 입력 허용
  - 공백 기준 다중식 분리
- README와 실제 동작을 일치시킬 것

## 현재 구조의 문제

현재 구현은 `parseDiceBlockSpec()`이 주사위 블록 하나를 단일 `kind`로 파싱하는 구조다. 이 구조에서는 suffix 전체가 한 규칙에 매칭되어야 하므로 `rr1kh3`, `xcs>7`, `min2rr1` 같은 modifier 조합을 표현할 수 없다. 또한 `rollDiceExpression()`은 괄호 evaluator를 사용하지 않고 `parseTerms()`와 `evaluateTerms()`만 사용하므로 README의 괄호/산술 설명과 실제 공개 API 동작도 어긋나 있다.

## 권장 아키텍처

### 1. 블록 모델 전환

기존:

- 주사위 블록 1개 -> `DiceBlockSpec.kind` 1개

변경:

- 주사위 블록 1개 -> `DiceTermSpec`
- `DiceTermSpec`는 `base`와 `modifiers[]`를 가진다

예시:

```ts
type DiceTermSpec = {
  notation: string;
  count: number;
  faces: number | '%';
  family: 'standard' | 'fate' | 'percentile';
  modifiers: DiceModifierSpec[];
};
```

```ts
type DiceModifierSpec =
  | { kind: 'keepHighest'; count: number }
  | { kind: 'keepLowest'; count: number }
  | { kind: 'dropHighest'; count: number }
  | { kind: 'dropLowest'; count: number }
  | { kind: 'rerollOnce'; predicate: ComparisonPredicate; source: 'fvtt-r' }
  | { kind: 'rerollRecursive'; predicate: ComparisonPredicate; source: 'fvtt-rr' }
  | { kind: 'explode'; predicate?: ComparisonPredicate; source: 'bang' | 'fvtt-x' }
  | { kind: 'explodeOnce'; predicate?: ComparisonPredicate; source: 'fvtt-xo' }
  | { kind: 'compound'; predicate?: ComparisonPredicate; source: 'bang-bang' }
  | { kind: 'countSuccess'; predicate: ComparisonPredicate }
  | { kind: 'countFailure'; predicate: ComparisonPredicate }
  | { kind: 'deductFailures'; predicate: ComparisonPredicate }
  | { kind: 'subtractFailureFaces'; predicate: ComparisonPredicate }
  | { kind: 'marginSuccess'; predicate: ComparisonPredicate }
  | { kind: 'minimum'; value: number }
  | { kind: 'maximum'; value: number }
  | { kind: 'countEven' }
  | { kind: 'countOdd' }
  | { kind: 'netSuccess'; success: ComparisonPredicate; failure: ComparisonPredicate };
```

이 구조로 바꾸면 modifier 순서를 보존할 수 있고, 적용 순서도 명시적으로 통제할 수 있다.

### 2. 파서 분리

하나의 정규식으로 전체 suffix를 판별하지 않고 아래 순서로 파싱한다.

1. 항 분리: `parseTerms()`
2. 블록 본체 읽기: `NdN`, `d%`, `dF`
3. suffix 스트림 읽기: `parseDiceModifiers()`
4. modifier를 순차 배열로 축적
5. 남은 문자가 있으면 오류 또는 호환 정책에 따라 실패 처리

핵심은 `readOneDiceBlock()`이 더 이상 “아는 패턴이 끝날 때까지 먹는” 함수가 아니라, “블록 본체 + suffix 원문”을 분리하는 구조가 되어야 한다는 점이다.

### 3. 실행기 분리

현재 `executeBlock()`은 `spec.kind` switch 기반이다. 이를 다음 2단계로 나눈다.

1. `rollBaseDiceTerm(spec)`
  - 기본 주사위, Fate, percentile 처리
2. `applyDiceModifiers(baseResult, spec.modifiers)`
  - modifier를 순서대로 적용

이때 keep/drop, reroll, explode, success-count 같은 modifier는 모두 공통 intermediate result를 받아 다음 modifier로 넘겨야 한다.

## modifier 충돌 및 적용 규칙

같이 섞어 쓸 수 있어야 하므로 “허용”과 “적용 순서”를 명시해야 한다.

### 허용 원칙

- 다음 계열은 조합 허용
  - reroll + explode
  - reroll + keep/drop
  - min/max + reroll
  - keep/drop + success count
  - explode + success count
- Fate와 percentile은 일반 숫자 주사위 modifier 일부만 허용한다
  - `dF`에는 keep/drop 정도만 우선 허용
  - `d%`에는 FVTT식 explode/reroll을 당장 허용할지 구현 단계에서 제한 가능

### 적용 순서 원칙

기본 원칙은 “입력 순서 유지”보다 “결과 일관성”이 중요하다. 따라서 내부 적용 순서는 고정한다.

1. base roll
2. min/max
3. reroll / reroll recursive
4. explode / explode once / compound
5. keep/drop
6. success/failure/margin 계열
7. 최종 합계 또는 카운트 산출

이 순서가 필요한 이유:

- `min/max`는 reroll 조건 전에 눈값을 안정화해야 한다
- reroll 후 explode 판정이 이뤄져야 한다
- keep/drop 후 success count를 할지, success count 후 keep/drop을 할지는 정의가 필요하지만, 첫 구현에서는 FVTT 호환 우선으로 “성공 카운트 계열은 최종 주사위 집합에 적용”으로 고정한다

### 문법 의미 재정의

- `r`: FVTT 1회 재굴림
- `rr`: FVTT 반복 재굴림
- `ro`: 제거
- `!`: 기존 explode 유지
- `!!`: 기존 compound 유지
- `x`: FVTT explode
- `xo`: FVTT explode once

### 고유 확장과 FVTT 문법의 공존

- `>NfM`는 프로젝트 전용 확장으로 유지
- FVTT success 계열과 동시 사용은 1차 구현에서 금지한다
  - 예: `5d10>8f1cs>=8`은 오류 처리
- 이유: `net success`와 `count success / deduct failures / margin success`는 결과 의미가 다르다

## 파일 구조 제안

### 수정 파일

- `src/utils/parseDiceBlocks.ts`
  - 항 분리와 블록 외곽 인식만 담당
- `src/utils/executeDiceBlocks.ts`
  - intermediate result 기반 실행기로 전환
- `src/types.ts`
  - `DiceTermSpec`, `DiceModifierSpec`, intermediate result 타입 추가
- `src/index.ts`
  - 새 roll 함수 export 정리
- `README.md`
  - 지원 문법과 비표준 확장 명세 수정
- `src/examples/index.example.ts`
  - 새 문법 예제 추가

### 신규 파일

- `src/utils/parseDiceModifiers.ts`
  - suffix 스트림에서 modifier 배열 생성
- `src/utils/diceModifierTypes.ts`
  - modifier/비교 predicate 타입 정의
- `src/utils/diceCompatibility.ts`
  - `!`/`x`, `r`/`rr`, 고유 확장 문법 정책 표
- `src/utils/applyDiceModifiers.ts`
  - intermediate result에 modifier 순차 적용
- `src/roll/rollExplodeOnce.ts`
  - `xo` 처리
- `src/roll/rollCountFailures.ts`
  - `cf`
- `src/roll/rollDeductFailures.ts`
  - `df`
- `src/roll/rollSubtractFailureFaces.ts`
  - `sf`
- `src/roll/rollMarginSuccess.ts`
  - `ms`

### 테스트 파일

- `tests/parser/parseDiceModifiers.test.ts`
- `tests/parser/parseDiceTermSpec.test.ts`
- `tests/compat/fvtt-reroll.test.ts`
- `tests/compat/fvtt-explode.test.ts`
- `tests/compat/fvtt-success.test.ts`
- `tests/compat/project-extension.test.ts`
- `tests/regression/readme-supported-syntax.test.ts`

## 구현 단계

### 단계 1. 파서 기반 정리

- `DiceTermSpec`와 `DiceModifierSpec` 타입 도입
- `parseDiceModifiers()` 작성
- `parseDiceBlockSpec()`를 `kind 1개` 방식에서 `base + modifiers[]` 방식으로 전환

### 단계 2. reroll/explode 의미 재정의

- `r`를 reroll once에 연결
- `rr`를 recursive reroll에 연결
- `ro` 제거
- `x`, `xo` 추가
- `!`, `!!` 유지

### 단계 3. modifier 조합 실행기 도입

- intermediate result 모델 작성
- modifier 적용 순서 구현
- keep/drop 이후 success 계열 처리 정리

### 단계 4. FVTT success 계열 확장

- `cs`, `cf`, `df`, `sf`, `ms`
- `even`, `odd`
- `min`, `max`

### 단계 5. 문서와 예제 정렬

- README의 지원 문법표 재작성
- 실제 동작과 불일치하는 괄호/산술 설명 수정
- 예제 갱신

## 비범위

이번 작업의 1차 범위에는 아래를 포함하지 않는다.

- 완전한 FVTT 산술/괄호/pool term 재현
- `@attribute` 데이터 참조
- flavor text
- Foundry 내부 객체 구조까지 동일하게 맞추는 것

## 위험 요소

- modifier 적용 순서가 잘못 정의되면 합법 문법이어도 결과가 직관과 달라질 수 있다
- `success` 계열과 `keep/drop` 조합은 테스트 설계가 중요하다
- 현재 테스트 인프라가 없으므로 문법 확장 전 테스트 러너부터 정해야 한다
- 공개 export 이름이 바뀌면 사용자 코드가 깨질 수 있으므로 호환성 방침이 필요하다

## 성공 기준

- `r`, `rr`, `x`, `xo`, `kh`, `kl`, `dh`, `dl`, `cs`, `cf`, `df`, `sf`, `ms`, `min`, `max`, `even`, `odd` 중 1차 범위 항목이 하나의 블록에서 조합 가능하다
- `!!`, `>NfM`, `ㅇ`, 공백 분리 다중식은 기존대로 유지된다
- README 예제와 실제 결과가 어긋나지 않는다
- 조합 문법 회귀 테스트가 추가된다
