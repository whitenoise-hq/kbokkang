import {
  CARD_GRADES,
  CARD_TYPES,
  formatDexNo,
  type CardGrade,
  type CardType,
} from '@kbokkang/shared'
import type { DexCardView, DexGradeProgress } from '@/types/dex'

/**
 * 도감 목업.
 *
 * ⚠️ **6-4 에서 `cards` + 내 `user_cards` 조회로 교체한 뒤 이 파일을 지운다.**
 *
 * 등급별 카드 수와 보유율은 **확률 테이블과 어긋나지 않게** 잡았다 — 일반은 많고 흔하게,
 * 신화는 적고 거의 없게. 그렇지 않으면 신화가 가득 찬 도감을 보며 그리드 디자인을
 * 판단하게 되는데, 실제로는 거의 잠긴 화면을 보게 된다.
 */

/** 등급별 등록 카드 수 — 어드민에서 실제로 등록할 규모의 예상치 */
const TOTALS: Record<CardGrade, number> = {
  normal: 30,
  rare: 25,
  epic: 20,
  legend: 10,
  mythic: 5,
}

/** 등급별 보유 확률 — 상위 등급일수록 낮다 */
const OWN_RATE: Record<CardGrade, number> = {
  normal: 0.55,
  rare: 0.35,
  epic: 0.2,
  legend: 0.15,
  mythic: 0.1,
}

const NAME_PARTS: Record<CardType, readonly string[]> = {
  player: ['좌완 에이스', '4번 타자', '대타 요원', '마무리', '유격수', '포수', '중견수'],
  mascot: ['호랑이 마스코트', '곰 마스코트', '독수리 마스코트', '사자 마스코트'],
  item: ['행운의 배트', '낡은 글러브', '사인볼', '우승 반지', '응원 타월'],
}

/**
 * **결정적으로** 만든다 — `Math.random()` 을 쓰면 화면을 다시 열 때마다 보유 카드가
 * 바뀌어 무엇이 바뀐 건지 알 수 없다(수집률 카드와 그리드가 어긋나 보인다).
 * 도감번호 순번을 씨앗으로 쓴다.
 */
const ownedCountOf = (grade: CardGrade, seq: number): number => {
  const threshold = Math.round(1 / OWN_RATE[grade])
  if (seq % threshold !== 0) return 0

  // 여분이 있는 카드가 섞여 있어야 판매 버튼을 확인할 수 있다
  return seq % (threshold * 3) === 0 ? 3 : 1
}

export const mockDexCards = (): readonly DexCardView[] =>
  CARD_GRADES.flatMap((grade) =>
    Array.from({ length: TOTALS[grade] }, (_unused, index) => {
      const seq = index + 1
      const cardType = CARD_TYPES[seq % CARD_TYPES.length] ?? 'player'
      const names = NAME_PARTS[cardType]
      const dexNo = formatDexNo({ grade, seq })

      return {
        id: dexNo,
        dexNo,
        name: names[seq % names.length] ?? '카드',
        grade,
        cardType,
        imageUrl: null,
        ownedCount: ownedCountOf(grade, seq),
      }
    }),
  )

export const mockDexProgress = (cards: readonly DexCardView[]): readonly DexGradeProgress[] =>
  CARD_GRADES.map((grade) => {
    const inGrade = cards.filter((card) => card.grade === grade)

    return {
      grade,
      owned: inGrade.filter((card) => card.ownedCount > 0).length,
      total: inGrade.length,
    }
  })
