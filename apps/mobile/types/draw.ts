import type { CardFaceView } from './card'

/**
 * 뽑은 카드 한 장 — 개봉 화면이 쓰는 뷰 모델.
 *
 * 6-4 에서 `draw_cards` RPC 응답이 이 모양으로 매핑된다.
 *
 * ## 중복은 자동 환급되지 않는다
 *
 * 중복이 나오면 **카드로 쌓이고**(`user_cards.count + 1`) 포인트는 주지 않는다.
 * 유저가 팔지 말지 고른다 — 뽑기 결과 화면의 "여분 판매"(방금 뽑은 중복을 한 번에) 또는
 * 도감 상세의 "여분 판매"(카드별)다.
 *
 * ⚠️ 처음 기획서는 **자동 환급 + 카드 지급**을 함께 적어 뒀는데, 그러면 같은 중복으로
 *    등급가를 **두 번** 받는다(환급받고, 쌓인 여분을 또 판다). 자동 환급을 폐지했다.
 *    그래서 이 타입에 `refundPoints` 가 없다 — 판매가는 등급에서 계산한다(`sellPriceOf`).
 */
export interface DrawnCardView extends CardFaceView {
  /** `user_cards.id` 또는 목업 키 */
  readonly id: string
  /** 이미 보유한 카드인가 — 여분으로 쌓이며, 팔 수 있다 */
  readonly isDuplicate: boolean
}
