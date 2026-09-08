import {
  CARD_GRADES,
  CARD_GRADE_META,
  DRAW_GRADE_RATES,
  type CardGrade,
  type DrawType,
} from '@kbokkang/shared'
import type { DrawnCardView } from '@/types/draw'

/**
 * 뽑기 화면 목업.
 *
 * ⚠️ **6-4 에서 `draw_cards` RPC 로 교체한 뒤 이 파일을 지운다.**
 *
 * ⚠️⚠️ **실제 추첨은 반드시 서버에서 한다**(통합기획서 6장). 여기서 확률을 굴리는 것은
 *    화면을 보기 위한 목업일 뿐이다. 클라이언트 추첨을 남겨두면 유저가 결과를 조작할 수
 *    있고, 포인트 차감·중복 환급이 DB 트랜잭션 밖에서 일어나 정합성이 깨진다.
 */

/** 보유 포인트 목업 — 프리미엄 10연차(2,850P)에는 모자란 값으로 둬서 잠금 상태를 본다 */
export const MOCK_POINTS = 1240

/** 등급별 목업 카드 이름. 실제 카드는 어드민에서 등록한다 */
const NAMES: Record<CardGrade, readonly string[]> = {
  normal: ['연습 배트', '글러브', '야구공'],
  rare: ['1루수', '중견수', '마무리 투수'],
  epic: ['4번 타자', '에이스 선발', '골든글러브'],
  legend: ['MVP', '트리플 크라운', '퍼펙트 게임'],
  mythic: ['영구결번', '전설의 3할', '한국시리즈 우승'],
}

/** 등급 확률표대로 등급 하나를 뽑는다(목업 전용) */
const rollGrade = (type: DrawType): CardGrade => {
  const rates = DRAW_GRADE_RATES[type]
  const total = CARD_GRADES.reduce((sum, grade) => sum + rates[grade], 0)
  let roll = Math.random() * total

  for (const grade of CARD_GRADES) {
    roll -= rates[grade]
    if (roll <= 0) return grade
  }

  // 부동소수 오차로 전부 빠져나갔을 때의 안전망
  return 'normal'
}

let sequence = 0

const drawOne = (type: DrawType): DrawnCardView => {
  const grade = rollGrade(type)
  const names = NAMES[grade]
  const name = names[Math.floor(Math.random() * names.length)] ?? '카드'
  sequence += 1

  // 중복은 실제로 흔하다(일반 등급이 60%) — 환급 표시를 확인할 수 있어야 한다
  const isDuplicate = grade === 'normal' && Math.random() < 0.5

  return {
    id: `mock-${String(sequence)}`,
    name,
    grade,
    // 도감번호는 등급 접두어 + 2자리(통합기획서 4.1)
    dexNo: `${CARD_GRADE_META[grade].prefix}${String(sequence % 30).padStart(2, '0')}`,
    imageUrl: null,
    isDuplicate,
    refundPoints: isDuplicate ? 5 : 0,
  }
}

export const mockDraw = (type: DrawType, count: number): readonly DrawnCardView[] =>
  Array.from({ length: count }, () => drawOne(type))
