import { DiceRollResult, KeepDropRollResult } from '../types';
import { diceRoll } from '../utils/diceRoll';

/**
 * @description 여러 개의 주사위를 굴린 뒤, 최하위 N개를 버리고 나머지만 합산합니다.
 * 예) 4d6dl1, 5d8dl2 등.
 * @param count 굴릴 주사위 개수
 * @param maxNumber 주사위의 최대 눈금
 * @param dropCount 하위에서 몇 개를 버릴지
 * @returns 최하위 N개를 제외한 굴림 결과
 */
export function rollDropLowest(
  count: number,
  maxNumber: number,
  dropCount: number
): KeepDropRollResult {
  const rolls: DiceRollResult[] = [];

  for (let i = 0; i < count; i++) {
    const rollResult = diceRoll(maxNumber);
    rolls.push(rollResult);
  }

  const sortedAsc = [ ...rolls, ].sort((a, b) => a.result - b.result);
  const effectiveDrop = Math.max(0, Math.min(dropCount, rolls.length));
  const kept = sortedAsc.slice(effectiveDrop);
  const dropped = sortedAsc.slice(0, effectiveDrop);

  const total = kept.reduce((acc, cur) => acc + cur.result, 0);

  return {
    minNumber: 1,
    maxNumber,
    all: rolls,
    kept,
    dropped,
    total,
  };
}
