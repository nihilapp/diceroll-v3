import { DiceRollResult, RollRerollResult } from '../types';
import { diceRoll } from '../utils/diceRoll';

/**
 * @description 주사위를 굴리되, 조건을 만족하면 해당 눈이 아닐 때까지 계속 다시 굴립니다 (Reroll).
 * 예) 1d20r1 -> 1이 나오면 1이 아닐 때까지 다시 굴림
 * 예) 1d6r<=2 -> 1, 2가 나오면 3 이상 나올 때까지 다시 굴림
 *
 * @param count 굴릴 주사위 개수
 * @param maxNumber 주사위의 최대 눈금 (예: d20 -> 20, d6 -> 6)
 * @param shouldReroll true를 반환하면 다시 굴림 (예: r1 -> (r) => r === 1, r<=2 -> (r) => r <= 2)
 * @param maxIterations 무한 반복 방지를 위한 최대 재굴림 횟수 (기본값: 1000)
 * @returns 최종 굴림 결과 (조건을 만족하지 않는 값만 사용)
 */
export function rollReroll(
  count: number,
  maxNumber: number,
  shouldReroll: (result: number) => boolean,
  maxIterations: number = 1000
): RollRerollResult {
  const rolls: DiceRollResult[] = [];

  for (let i = 0; i < count; i++) {
    let rollResult = diceRoll(maxNumber);
    let iterationCount = 0;

    while (shouldReroll(rollResult.result) && iterationCount < maxIterations) {
      iterationCount++;
      rollResult = diceRoll(maxNumber);
    }

    rolls.push(rollResult);
  }

  return {
    kind: 'reroll',
    minNumber: 1,
    maxNumber,
    rolls,
    total: rolls.reduce((acc, cur) => acc + cur.result, 0),
  };
}
