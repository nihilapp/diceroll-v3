import { DiceRollResult } from '../types';
import { diceRoll } from '../utils/diceRoll';

/**
 * @description d% (퍼센타일) 굴림 - 1~100 사이 난수 생성 (CoC 판정 등).
 * 내부적으로는 d100 한 번 굴리는 것과 동일하게 처리합니다.
 * @returns 퍼센타일 굴림 결과 (1~100)
 */
export function rollPercentile(): DiceRollResult {
  return diceRoll(100);
}
