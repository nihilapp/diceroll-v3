import { DiceRollResult, RollExplodeResult } from '../types';
import { diceRoll } from '../utils/diceRoll';

/**
 * @description 주사위를 굴리되, 특정 조건을 만족하면 추가 주사위를 굴립니다 (Explode).
 * 예) 10d6! -> 6이 나오면 주사위 추가
 * 예) 5d10!>8 -> 9, 10이 나오면 주사위 추가
 *
 * @param count 굴릴 주사위 개수 (예: 10d6!의 10)
 * @param maxNumber 주사위의 최대 눈금 (예: d6 -> 6, d10 -> 10)
 * @param threshold explode 조건을 만족하는 최소값 (기본값: maxNumber)
 *                   예) maxNumber=10, threshold=9이면 9 이상일 때 explode
 * @param maxIterations 무한 반복 방지를 위한 최대 반복 횟수 (기본값: 1000)
 * @returns 주사위 굴림 결과 (explode된 주사위 포함)
 */
export function rollExplode(
  count: number,
  maxNumber: number,
  threshold: number = maxNumber,
  maxIterations: number = 1000
): RollExplodeResult {
  const rolls: DiceRollResult[] = [];
  let iterationCount = 0;

  // 기본 주사위들을 굴림
  for (let i = 0; i < count; i++) {
    const rollResult = diceRoll(maxNumber);
    rolls.push(rollResult);

    // explode 로직: 조건을 만족하면 추가 주사위를 굴림
    let currentRoll = rollResult;
    while (currentRoll.result >= threshold && iterationCount < maxIterations) {
      iterationCount++;
      const explodeRoll = diceRoll(maxNumber);
      rolls.push(explodeRoll);
      currentRoll = explodeRoll;
    }
  }

  return {
    kind: 'explode',
    minNumber: 1,
    maxNumber,
    rolls,
    total: rolls.reduce((acc, cur) => acc + cur.result, 0),
  };
}
