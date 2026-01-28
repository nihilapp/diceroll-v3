import { FateDieValue, FateRollResult } from '../types';

function rollSingleFateDie(): FateDieValue {
  const faces: readonly FateDieValue[] = [
    -1,
    0,
    1,
  ];
  const index = Math.floor(Math.random() * faces.length);
  return faces[index];
}

/**
 * @description Fate 시스템용 주사위 굴림.
 * - 기본값은 4dF (Fate Core 등에서 사용하는 표준)
 * - count를 1로 주면 1dF, 기타 N으로 주면 NdF로 동작
 * @param count 굴릴 주사위 개수 (기본값: 4)
 * @returns Fate 주사위 굴림 결과
 */
export function rollFate(count: number = 4): FateRollResult {
  const dice: FateDieValue[] = [];

  for (let i = 0; i < count; i++) {
    dice.push(rollSingleFateDie());
  }

  const total = dice.reduce((acc, cur) => acc + cur, 0);

  return {
    dice,
    total,
  };
}
