import { BasicDiceRollResult, DiceRollResult } from '../types';
import { diceRoll } from '../utils/diceRoll';

/**
 * @description 주사위를 여러 번 굴립니다. (예: 2개 주사위, 각 6면)
 * @param count 굴릴 주사위의 개수
 * @param maxNumber 주사위의 최대 눈금 (예: 6이면 1~6)
 * @returns 주사위 굴림 결과
 */
export function rollBasic(count: number, maxNumber: number): BasicDiceRollResult {
  const rolls: DiceRollResult[] = [];

  for (let i = 0; i < count; i++) {
    const rollResult: DiceRollResult = diceRoll(maxNumber);
    rolls.push(rollResult);
  }

  return {
    minNumber: 1,
    maxNumber,
    rolls,
    total: rolls.reduce((acc, cur) => acc + cur.result, 0),
  };
}
