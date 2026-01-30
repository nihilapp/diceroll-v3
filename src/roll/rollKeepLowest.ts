import { DiceRollResult, RollKeepLowestResult } from '../types';
import { diceRoll } from '../utils/diceRoll';

/**
 * @description 여러 개의 주사위를 굴린 뒤, 최하위 N개만 선택해 합산합니다.
 * 예) 2d20kl1, 3d6kl1 등 D&D 불리함(Disadvantage)류에 사용.
 * @param count 굴릴 주사위 개수
 * @param maxNumber 주사위의 최대 눈금
 * @param keepCount 하위에서 몇 개를 유지할지
 * @returns 최하위 N개만 선택한 굴림 결과
 */
export function rollKeepLowest(
  count: number,
  maxNumber: number,
  keepCount: number
): RollKeepLowestResult {
  const rolls: DiceRollResult[] = [];

  for (let i = 0; i < count; i++) {
    const rollResult = diceRoll(maxNumber);
    rolls.push(rollResult);
  }

  const sortedAsc = [ ...rolls, ].sort((a, b) => a.result - b.result);
  const effectiveKeep = Math.max(0, Math.min(keepCount, rolls.length));
  const kept = sortedAsc.slice(0, effectiveKeep);
  const dropped = sortedAsc.slice(effectiveKeep);

  const total = kept.reduce((acc, cur) => acc + cur.result, 0);

  return {
    kind: 'keepLowest',
    minNumber: 1,
    maxNumber,
    all: rolls,
    kept,
    dropped,
    total,
  };
}
