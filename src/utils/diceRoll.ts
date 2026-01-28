import { DiceRollResult } from '../types';

/**
 * @description 가장 기본 단위의 주사위(1 ~ maxNumber)를 한 번 굴립니다.
 * @param {number} maxNumber 주사위의 최대 눈금 (예: 6이면 1~6)
 * @returns {DiceRollResult} 주사위 굴림 결과
 */
export function diceRoll(maxNumber: number): DiceRollResult {
  const minNumber = 1;
  const result = Math.floor(Math.random() * maxNumber) + minNumber;

  return {
    minNumber,
    maxNumber,
    result,
    isFumble: result === minNumber,
    isCritical: result === maxNumber,
  };
}
