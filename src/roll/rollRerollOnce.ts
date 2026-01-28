import { BasicDiceRollResult, DiceRollResult } from '../types';
import { diceRoll } from '../utils/diceRoll';

/**
 * @description 주사위를 굴리되, 조건을 만족하면 단 한 번만 다시 굴립니다 (Reroll Once).
 * 예) 1d20ro1 -> 1이 나오면 한 번만 다시 굴림
 * 예) 2d6ro<2 -> 1이 나오면 한 번만 다시 굴림
 *
 * @param count 굴릴 주사위 개수
 * @param maxNumber 주사위의 최대 눈금 (예: d20 -> 20, d6 -> 6)
 * @param shouldReroll true를 반환하면 한 번만 다시 굴림 (예: ro1 -> (r) => r === 1, ro<2 -> (r) => r < 2)
 * @returns 최종 굴림 결과 (조건 만족 시 한 번만 재굴림한 값 사용)
 */
export function rollRerollOnce(
  count: number,
  maxNumber: number,
  shouldReroll: (result: number) => boolean
): BasicDiceRollResult {
  const rolls: DiceRollResult[] = [];

  for (let i = 0; i < count; i++) {
    let rollResult = diceRoll(maxNumber);

    if (shouldReroll(rollResult.result)) {
      rollResult = diceRoll(maxNumber);
    }

    rolls.push(rollResult);
  }

  return {
    minNumber: 1,
    maxNumber,
    rolls,
    total: rolls.reduce((acc, cur) => acc + cur.result, 0),
  };
}
