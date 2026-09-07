import { formatRemaining, isImminent, type GamePhase, type Remaining } from '@kbokkang/shared'
import type { ColorToken } from '@/theme/colors'

/**
 * 경기 단계 → 배지 표시.
 *
 * 단계 판정 자체는 `gamePhaseOf`(shared)가 하고, 여기서는 **표시만** 담당한다.
 * 화면마다 라벨·색을 따로 쓰면 같은 상태가 다르게 보인다.
 */
export interface StatusView {
  readonly label: string
  readonly tone: ColorToken
}

export const statusViewOf = (phase: GamePhase, remaining: Remaining | null): StatusView => {
  switch (phase) {
    case 'cancelled':
      return { label: '경기 취소', tone: 'textAlt' }
    case 'open':
      // 마감이 임박하면 강조한다(앱기획서 3.2). remaining 이 없으면 판정이 어긋난 것이므로
      // 예측 가능이라고 표시하지 않는다.
      if (remaining === null) return { label: '마감', tone: 'textAlt' }
      return {
        label: formatRemaining(remaining),
        tone: isImminent(remaining) ? 'danger' : 'primary',
      }
    case 'closed':
      return { label: '예측 마감', tone: 'textAlt' }
    case 'live':
      return { label: '경기중', tone: 'primary' }
    case 'aggregating':
      // 정산 전이라는 것을 명확히 알린다 — 포인트가 안 들어왔다는 오해를 막는다(앱기획서 4장)
      return { label: '집계중', tone: 'warning' }
    case 'settled':
      return { label: '종료', tone: 'textAlt' }
  }
}
