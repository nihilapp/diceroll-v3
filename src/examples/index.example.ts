import { rollBasic } from '@/roll/rollBasic';
import { rollCompound } from '@/roll/rollCompound';
import { rollExplode } from '@/roll/rollExplode';
import { rollFate } from '@/roll/rollFate';
import { rollKeepHighest } from '@/roll/rollKeepHighest';
import { rollNetSuccess } from '@/roll/rollNetSuccess';
import { rollPercentile } from '@/roll/rollPercentile';
import { rollReroll } from '@/roll/rollReroll';
import { rollRerollOnce } from '@/roll/rollRerollOnce';
import { rollSuccess } from '@/roll/rollSuccess';

// 예시 1: 기본 주사위 롤 (예: 5d20)
const basic = rollBasic(5, 20);
console.log('=== rollBasic(5, 20) -> 5d20 ===');
console.log(basic);

// 예시 2: d% (퍼센타일, 1~100)
const percentile = rollPercentile();
console.log('=== rollPercentile() -> d% ===');
console.log(percentile);

// 예시 3: Fate 주사위 (기본 4dF)
const fate = rollFate();
console.log('=== rollFate() -> 4dF ===');
console.log(fate);

// 예시 4: 4d6kh3 (4개 중 높은 3개만 합산)
const kh = rollKeepHighest(4, 6, 3);
console.log('=== rollKeepHighest(4, 6, 3) -> 4d6kh3 ===');
console.log(kh);

// 예시 5: 10d6! (6이 나오면 주사위 추가)
const explode1 = rollExplode(10, 6);
console.log('=== rollExplode(10, 6) -> 10d6! ===');
console.log(explode1);

// 예시 6: 5d10!>8 (9, 10이 나오면 주사위 추가)
const explode2 = rollExplode(5, 10, 9);
console.log('=== rollExplode(5, 10, 9) -> 5d10!>8 ===');
console.log(explode2);

// 예시 7: 10d6!! (6이 나오면 추가 굴림 값을 기존 주사위 눈에 합쳐서 표시)
const compound1 = rollCompound(10, 6);
console.log('=== rollCompound(10, 6) -> 10d6!! ===');
console.log(compound1);

// 예시 8: 1d4!! (4가 나오면 계속 더해서 단일 숫자로 반환)
const compound2 = rollCompound(1, 4);
console.log('=== rollCompound(1, 4) -> 1d4!! ===');
console.log(compound2);

// 예시 9: 1d20r1 (1이 나오면 1이 아닐 때까지 다시 굴림)
const reroll1 = rollReroll(1, 20, (r) => r === 1);
console.log('=== rollReroll(1, 20, r=>r===1) -> 1d20r1 ===');
console.log(reroll1);

// 예시 10: 1d6r<=2 (1, 2가 나오면 3 이상 나올 때까지 다시 굴림)
const reroll2 = rollReroll(1, 6, (r) => r <= 2);
console.log('=== rollReroll(1, 6, r=>r<=2) -> 1d6r<=2 ===');
console.log(reroll2);

// 예시 11: 1d20ro1 (1이 나오면 단 한 번만 다시 굴림)
const rerollOnce1 = rollRerollOnce(1, 20, (r) => r === 1);
console.log('=== rollRerollOnce(1, 20, r=>r===1) -> 1d20ro1 ===');
console.log(rerollOnce1);

// 예시 12: 2d6ro<2 (1이 나오면 한 번만 다시 굴림)
const rerollOnce2 = rollRerollOnce(2, 6, (r) => r < 2);
console.log('=== rollRerollOnce(2, 6, r=>r<2) -> 2d6ro<2 ===');
console.log(rerollOnce2);

// 예시 13: 5d10>7 (7을 초과하는 주사위 개수, WoD)
const success1 = rollSuccess(5, 10, (r) => r > 7);
console.log('=== rollSuccess(5, 10, r=>r>7) -> 5d10>7 ===');
console.log(success1);

// 예시 14: 3d6=6 (정확히 6인 주사위 개수)
const success2 = rollSuccess(3, 6, (r) => r === 6);
console.log('=== rollSuccess(3, 6, r=>r===6) -> 3d6=6 ===');
console.log(success2);

// 예시 15: 5d10>8f1 (9,10은 +1, 1은 -1, 순성공 합산)
const netSuccess1 = rollNetSuccess(5, 10, (r) => r > 8, (r) => r === 1);
console.log('=== rollNetSuccess(5, 10, r=>r>8, r=>r===1) -> 5d10>8f1 ===');
console.log(netSuccess1);

// 예시 16: 6d6>4f<=2 (5,6은 +1, 1,2는 -1, 순성공 합산)
const netSuccess2 = rollNetSuccess(6, 6, (r) => r > 4, (r) => r <= 2);
console.log('=== rollNetSuccess(6, 6, r=>r>4, r=>r<=2) -> 6d6>4f<=2 ===');
console.log(netSuccess2);
