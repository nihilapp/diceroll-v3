import { DiceRollResult, RollKeepHighestResult } from '../types';
import { diceRoll } from '../utils/diceRoll';

/**
 * @description 여러 개의 주사위를 굴린 뒤, 상위 N개만 선택해 합산합니다.
 * 예) 4d6kh3, 2d20kh1 등 D&D 계열 룰의 Advantage/능력치 생성 등에 사용.
 * @param count 굴릴 주사위 개수 (예: 4d6kh3의 4)
 * @param maxNumber 주사위의 최대 눈금 (예: d6 -> 6, d20 -> 20)
 * @param keepCount 상위에서 몇 개를 유지할지 (예: 4d6kh3의 3)
 * @returns 상위 N개만 선택한 굴림 결과
 */
export function rollKeepHighest(
  count: number,
  maxNumber: number,
  keepCount: number
): RollKeepHighestResult {
  const rolls: DiceRollResult[] = [];

  for (let i = 0; i < count; i++) {
    const rollResult = diceRoll(maxNumber);
    rolls.push(rollResult);
  }

  const sortedDesc = [ ...rolls, ].sort((a, b) => b.result - a.result);
  const effectiveKeep = Math.max(0, Math.min(keepCount, rolls.length));
  const kept = sortedDesc.slice(0, effectiveKeep);
  const dropped = sortedDesc.slice(effectiveKeep);

  const total = kept.reduce((acc, cur) => acc + cur.result, 0);

  return {
    kind: 'keepHighest',
    minNumber: 1,
    maxNumber,
    all: rolls,
    kept,
    dropped,
    total,
  };
}
