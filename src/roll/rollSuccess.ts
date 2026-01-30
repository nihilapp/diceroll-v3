import { DiceRollResult, RollSuccessResult } from '../types';
import { diceRoll } from '../utils/diceRoll';

/**
 * @description 주사위를 굴리고, 성공 조건을 만족하는 주사위 개수만 카운트합니다 (WoD 등).
 * 예) 5d10>7 -> 7을 초과하는 주사위 개수
 * 예) 3d6=6 -> 정확히 6인 주사위 개수
 *
 * @param count 굴릴 주사위 개수
 * @param maxNumber 주사위의 최대 눈금 (예: d10 -> 10, d6 -> 6)
 * @param isSuccess true이면 성공으로 카운트 (예: >7 -> (r) => r > 7, =6 -> (r) => r === 6)
 * @returns 굴림 결과와 성공 개수
 */
export function rollSuccess(
  count: number,
  maxNumber: number,
  isSuccess: (result: number) => boolean
): RollSuccessResult {
  const rolls: DiceRollResult[] = [];

  for (let i = 0; i < count; i++) {
    rolls.push(diceRoll(maxNumber));
  }

  const successCount = rolls.filter((r) => isSuccess(r.result)).length;

  return {
    kind: 'success',
    minNumber: 1,
    maxNumber,
    rolls,
    successCount,
  };
}
