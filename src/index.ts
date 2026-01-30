// 메인 엔트리: API와 개별 roll 함수들을 재노출(re-export) 합니다.

export { rollDiceExpression, parseDiceExpression } from './expressionApi';

// expression API 반환 타입
export type { DiceExpressionResult } from './types';
export type ParsedDiceExpressionResult = string[];

// roll 함수별 반환 타입 (함수명·굴림 유형 kind 포함, 사용자 직접 사용용)
export type {
  RollBasicResult,
  RollCompoundResult,
  RollDropHighestResult,
  RollDropLowestResult,
  RollExplodeResult,
  RollFateResult,
  RollKeepHighestResult,
  RollKeepLowestResult,
  RollKind,
  RollNetSuccessResult,
  RollPercentileResult,
  RollRerollResult,
  RollRerollOnceResult,
  RollResult,
  RollSuccessResult
} from './types';

// 개별 roll 함수들 (직접 임포트해서 사용할 수 있도록 노출)
export { rollBasic } from './roll/rollBasic';
export { rollCompound } from './roll/rollCompound';
export { rollDropHighest } from './roll/rollDropHighest';
export { rollDropLowest } from './roll/rollDropLowest';
export { rollExplode } from './roll/rollExplode';
export { rollFate } from './roll/rollFate';
export { rollKeepHighest } from './roll/rollKeepHighest';
export { rollKeepLowest } from './roll/rollKeepLowest';
export { rollNetSuccess } from './roll/rollNetSuccess';
export { rollPercentile } from './roll/rollPercentile';
export { rollReroll } from './roll/rollReroll';
export { rollRerollOnce } from './roll/rollRerollOnce';
export { rollSuccess } from './roll/rollSuccess';
