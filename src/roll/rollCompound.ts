import { BasicDiceRollResult, DiceRollResult } from '../types';
import { diceRoll } from '../utils/diceRoll';

/**
 * @description 주사위를 굴리되, 최대값이 나오면 추가 굴림 값을 기존 주사위 눈에 합쳐서 표시합니다 (Compound).
 * 예) 10d6!! -> 6이 나오면 다시 굴려서 기존 값에 더함
 * 예) 1d4!! -> 4가 나오면 계속 더해서 단일 숫자로 반환
 *
 * @param count 굴릴 주사위 개수 (예: 10d6!!의 10)
 * @param maxNumber 주사위의 최대 눈금 (예: d6 -> 6, d4 -> 4)
 * @param threshold compound 조건을 만족하는 최소값 (기본값: maxNumber)
 *                  예) maxNumber=10, threshold=9이면 9 이상일 때 compound
 * @param maxIterations 무한 반복 방지를 위한 최대 반복 횟수 (기본값: 1000)
 * @returns 주사위 굴림 결과 (compound된 값 포함)
 */
export function rollCompound(
  count: number,
  maxNumber: number,
  threshold: number = maxNumber,
  maxIterations: number = 1000
): BasicDiceRollResult {
  const rolls: DiceRollResult[] = [];

  // 각 주사위를 굴림
  for (let i = 0; i < count; i++) {
    const firstRoll = diceRoll(maxNumber);
    let iterationCount = 0;
    let compoundValue = firstRoll.result;
    let currentRoll = firstRoll;

    // compound 로직: 조건을 만족하면 추가 굴림 값을 기존 값에 더함
    while (currentRoll.result >= threshold && iterationCount < maxIterations) {
      iterationCount++;
      const additionalRoll = diceRoll(maxNumber);
      compoundValue += additionalRoll.result;
      currentRoll = additionalRoll;
    }

    // 최종 결과를 rolls에 추가 (compound된 값으로 업데이트, 첫 번째 굴림의 critical/fumble 플래그 유지)
    rolls.push({
      minNumber: firstRoll.minNumber,
      maxNumber: firstRoll.maxNumber,
      result: compoundValue,
      isCritical: firstRoll.isCritical,
      isFumble: firstRoll.isFumble,
    });
  }

  return {
    minNumber: 1,
    maxNumber,
    rolls,
    total: rolls.reduce((acc, cur) => acc + cur.result, 0),
  };
}
