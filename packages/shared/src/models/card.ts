import type { CardGrade } from '../grades'
import type { CardType } from '../card-types'

/**
 * 카드 마스터 — 통합기획서 5장 `cards` 대응.
 * 판매가/환급가는 저장하지 않고 등급 상수로 계산한다(points.ts).
 */
export interface Card {
  readonly id: string
  /** 도감번호 N01 등. 등급 선택 시 자동 부여 */
  readonly dexNo: string
  readonly name: string
  readonly grade: CardGrade
  readonly type: CardType
  /** Supabase Storage URL. 이미지 업로드 전 임시 저장을 허용하므로 null 가능 */
  readonly imageUrl: string | null
  /** 같은 등급 내 뽑기 가중치 */
  readonly drawWeight: number
  readonly isSeason: boolean
  readonly createdAt: string
  /** soft delete 시각. 보유자가 있는 카드는 하드 삭제하지 않는다 */
  readonly deletedAt: string | null
}

/** 카드 목록 화면 필터 */
export interface CardFilter {
  readonly grade: CardGrade | null
  readonly type: CardType | null
  readonly isSeason: boolean | null
  /** 이름 또는 도감번호 검색어 */
  readonly keyword: string
  readonly includeDeleted: boolean
}

export const EMPTY_CARD_FILTER: CardFilter = {
  grade: null,
  type: null,
  isSeason: null,
  keyword: '',
  includeDeleted: false,
}

/** 등급별 카드 보유 집계 — 대시보드/통계 */
export interface CardGradeCount {
  readonly grade: CardGrade
  readonly count: number
}
