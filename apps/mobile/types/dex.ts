import type { CardGrade, CardType } from '@kbokkang/shared'

/**
 * 도감 카드 한 장 — 도감 그리드·상세가 쓰는 뷰 모델.
 *
 * **등록된 카드 전체**를 담는다(미보유 포함). 도감은 "무엇을 아직 못 가졌는지"를
 * 보여주는 화면이라 보유 목록만으로는 만들 수 없다 — `cards` 전체에 내 `user_cards`
 * 수량을 붙인 형태다.
 */
export interface DexCardView {
  readonly id: string
  /** 도감번호 — `N01` */
  readonly dexNo: string
  readonly name: string
  readonly grade: CardGrade
  readonly cardType: CardType
  /**
   * 카드 통이미지 URL. **아직 등록된 카드가 없어 목업은 null 이다.**
   * null 이면 자리표시 아이콘을 그린다.
   */
  readonly imageUrl: string | null
  /** 보유 수량. 0 이면 미보유 */
  readonly ownedCount: number
}

/** 등급별 수집 진행률 */
export interface DexGradeProgress {
  readonly grade: CardGrade
  readonly owned: number
  readonly total: number
}
