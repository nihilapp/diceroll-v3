export type DiceRollResult = {
  minNumber: number;
  maxNumber: number;
  result: number;
  isFumble: boolean;
  isCritical: boolean;
};

export type BasicDiceRollResult = {
  minNumber: number;
  maxNumber: number;
  rolls: DiceRollResult[];
  total: number;
};

export type KeepDropRollResult = {
  minNumber: number;
  maxNumber: number;
  all: DiceRollResult[];
  kept: DiceRollResult[];
  dropped: DiceRollResult[];
  total: number;
};

export type FateDieValue = -1 | 0 | 1;

export type FateRollResult = {
  dice: FateDieValue[];
  total: number;
};

/** 성공 조건을 만족하는 주사위 개수만 카운트 (WoD 등) */
export type SuccessRollResult = {
  minNumber: number;
  maxNumber: number;
  rolls: DiceRollResult[];
  successCount: number;
};

/** 성공(+1)·실패(-1)를 합산한 순성공 (WoD 등) */
export type NetSuccessRollResult = {
  minNumber: number;
  maxNumber: number;
  rolls: DiceRollResult[];
  successCount: number;
  failureCount: number;
  total: number; // successCount - failureCount
};

/** 주사위 표현식 파싱용 토큰 타입 */
export type Token
  = | { type: 'PLUS' }
    | { type: 'MINUS' }
    | { type: 'DICE';
      count: number;
      sides: number; }
      | { type: 'NUMBER';
        value: number; }
        | { type: 'LEFT_PAREN' }
        | { type: 'RIGHT_PAREN' };

/** 주사위 표현식 항 상세 정보 */
export type ExpressionTermDetail
  = | { type: 'dice';
    count: number;
    sides: number;
    rollResult: BasicDiceRollResult;
    sign: '+' | '-'; }
    | { type: 'number';
      value: number;
      sign: '+' | '-'; }
      | { type: 'subexpression';
        expression: string;
        result: number;
        sign: '+' | '-'; };

/** (Legacy) 단일 주사위식 실행 결과: 토큰/괄호 기반 평가용 */
export type DiceExpressionLegacyResult = {
  expression: string;
  total: number;
  details: ExpressionTermDetail[];
};

/** 여러 주사위식 실행 결과 (배열) */
export type DiceExpressionLegacyResults = DiceExpressionLegacyResult[];

/** ---------- roll 함수별 반환 타입 (함수명과 통일, 굴림 유형 kind 포함) ---------- */
/** 굴림 유형 (DiceBlockRollDetail.kind 및 각 Roll*Result.kind와 동일) */
export type RollKind
  = 'basic' | 'compound' | 'explode' | 'keepHighest' | 'keepLowest'
    | 'dropHighest' | 'dropLowest' | 'reroll' | 'rerollOnce'
    | 'success' | 'netSuccess' | 'percentile' | 'fate';

export type RollBasicResult = BasicDiceRollResult & { kind: 'basic' };
export type RollCompoundResult = BasicDiceRollResult & { kind: 'compound' };
export type RollDropHighestResult = KeepDropRollResult & { kind: 'dropHighest' };
export type RollDropLowestResult = KeepDropRollResult & { kind: 'dropLowest' };
export type RollExplodeResult = BasicDiceRollResult & { kind: 'explode' };
export type RollFateResult = FateRollResult & { kind: 'fate' };
export type RollKeepHighestResult = KeepDropRollResult & { kind: 'keepHighest' };
export type RollKeepLowestResult = KeepDropRollResult & { kind: 'keepLowest' };
export type RollNetSuccessResult = NetSuccessRollResult & { kind: 'netSuccess' };
export type RollPercentileResult = DiceRollResult & { kind: 'percentile' };
export type RollRerollResult = BasicDiceRollResult & { kind: 'reroll' };
export type RollRerollOnceResult = BasicDiceRollResult & { kind: 'rerollOnce' };
export type RollSuccessResult = SuccessRollResult & { kind: 'success' };

/** 모든 roll 함수 반환 타입의 합집합 (discriminated union) */
export type RollResult
  = RollBasicResult | RollCompoundResult | RollDropHighestResult | RollDropLowestResult
    | RollExplodeResult | RollFateResult | RollKeepHighestResult | RollKeepLowestResult
    | RollNetSuccessResult | RollPercentileResult | RollRerollResult | RollRerollOnceResult
    | RollSuccessResult;

/** 보정치 한 항 (부호 + 숫자) */
export type ModifierEntry = {
  sign: '+' | '-';
  value: number;
};

/** 주사위 블록별 굴림 결과 (어떤 roll 함수 결과든 total/result 추출 가능) */
export type DiceBlockRollDetail = {
  /** 원본 블록 문자열 (예: "4d20kl2") */
  block: string;
  /** 블록 종류 (어떤 roll 함수로 계산했는지) */
  kind: RollKind;
  /** 이 블록의 합산 기여값 (total 또는 successCount 등) */
  contribution: number;
  /** 원본 굴림 결과 (각 Roll*Result, kind 포함) */
  rollResult: RollResult;
};

/** 단일 주사위식 실행 결과 (블록 위임 + 보정치 분리) */
export type DiceExpressionResult = {
  /** 주사위식 원문 */
  expression: string;
  /** 총계 (모든 블록 contribution + 보정치 합) */
  total: number;
  /** 상세 주사위식별 굴림 정보 */
  rollDetails: DiceBlockRollDetail[];
  /** 보정치 배열 */
  modifiers: ModifierEntry[];
};
