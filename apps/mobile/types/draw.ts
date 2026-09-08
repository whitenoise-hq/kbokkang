import type { CardGrade } from '@kbokkang/shared'

/**
 * 뽑은 카드 한 장 — 개봉 화면이 쓰는 뷰 모델.
 *
 * 6-4 에서 `draw_cards` RPC 응답이 이 모양으로 매핑된다. 화면은 이 타입만 의존하므로
 * 목업 → 실데이터 교체 시 화면 코드가 바뀌지 않는다.
 */
export interface DrawnCardView {
  /** `user_cards.id` 또는 목업 키 */
  readonly id: string
  readonly name: string
  readonly grade: CardGrade
  /** 도감번호 — `N01` */
  readonly dexNo: string
  /**
   * 카드 통이미지 URL. **아직 등록된 카드가 없어 목업은 null 이다.**
   * null 이면 `CardFace` 가 등급색 자리표시 프레임을 그린다.
   */
  readonly imageUrl: string | null
  /** 이미 보유한 카드인가 — 중복이면 포인트로 환급된다 */
  readonly isDuplicate: boolean
  readonly refundPoints: number
}
