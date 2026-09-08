import type { CardGrade } from '@kbokkang/shared'

/**
 * 카드 앞면을 그리는 데 필요한 최소 정보.
 *
 * 뽑기 결과(`DrawnCardView`)와 도감 카드(`DexCardView`)가 **둘 다 이 모양을 포함**한다.
 * `CardFace` 가 이 타입만 받으므로 두 화면이 같은 컴포넌트를 쓸 수 있다.
 *
 * ⚠️ **중복 여부·보유 수량 같은 "내 상태"를 여기 넣지 않는다.** 카드 앞면은 카드 자체를
 *    그리는 일만 한다 — 중복 배지는 뽑기 화면이, 보유 수량은 도감이 각자 얹는다.
 *    한번 넣었다가 도감 상세에서 `isDuplicate: false` 같은 의미 없는 값을 채워 넣게 됐다.
 */
export interface CardFaceView {
  readonly name: string
  readonly grade: CardGrade
  /** 도감번호 — `N01` */
  readonly dexNo: string
  /** 통이미지 URL. null 이면 자리표시 프레임을 그린다 */
  readonly imageUrl: string | null
}
