import { DiceRollResult, RollNetSuccessResult } from '../types';
import { diceRoll } from '../utils/diceRoll';

/**
 * @description 주사위를 굴리고, 성공(+1)·실패(-1)로 계산하여 순성공(합산)을 반환합니다 (WoD 등).
 * 예) 5d10>8f1 -> 9, 10은 +1, 1은 -1, 나머지 0
 * 예) 6d6>4f<=2 -> 5, 6은 +1, 1, 2는 -1, 3, 4는 0
 *
 * @param count 굴릴 주사위 개수
 * @param maxNumber 주사위의 최대 눈금
 * @param isSuccess 성공 조건 (true면 +1)
 * @param isFailure 실패 조건 (true면 -1). 성공·실패 둘 다 true면 보통 실패로 취급하거나 규칙에 따름.
 * @returns 굴림 결과, 성공/실패 개수, total = successCount - failureCount
 */
export function rollNetSuccess(
  count: number,
  maxNumber: number,
  isSuccess: (result: number) => boolean,
  isFailure: (result: number) => boolean
): RollNetSuccessResult {
  const rolls: DiceRollResult[] = [];

  for (let i = 0; i < count; i++) {
    rolls.push(diceRoll(maxNumber));
  }

  let successCount = 0;
  let failureCount = 0;
  for (const r of rolls) {
    if (isFailure(r.result)) failureCount += 1;
    else if (isSuccess(r.result)) successCount += 1;
  }

  return {
    kind: 'netSuccess',
    minNumber: 1,
    maxNumber,
    rolls,
    successCount,
    failureCount,
    total: successCount - failureCount,
  };
}
