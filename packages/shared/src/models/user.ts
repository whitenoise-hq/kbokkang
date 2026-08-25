import type { CardGrade } from '../grades'
import type { PointReason } from '../points'
import type { DrawType } from '../draw'

/**
 * 유저 프로필 — 통합기획서 5장 `users` 대응.
 * 목록 화면에는 도감 진행률이 필요하므로 집계 컬럼이 함께 온다(뷰 또는 조인).
 */
export interface UserSummary {
  readonly id: string
  readonly nickname: string
  readonly favoriteTeamId: number | null
  readonly points: number
  /** 보유 카드 종수(중복 제외) — 집계값 */
  readonly ownedCardKinds: number
  readonly createdAt: string
}

/** 등급별 도감 진행률 */
export interface DexProgress {
  readonly grade: CardGrade
  readonly owned: number
  readonly total: number
}

/** 유저 보유 카드 한 줄 */
export interface OwnedCard {
  readonly cardId: string
  readonly dexNo: string
  readonly name: string
  readonly grade: CardGrade
  readonly count: number
  readonly acquiredAt: string
}

/** 뽑기 이력 한 줄 — `draws` 대응 */
export interface DrawLog {
  readonly id: string
  readonly drawType: DrawType
  readonly cardId: string
  readonly cardDexNo: string
  readonly cardName: string
  readonly cardGrade: CardGrade
  readonly cost: number
  readonly isDuplicate: boolean
  readonly refundPoints: number
  readonly createdAt: string
}

/** 포인트 변동 내역 한 줄 — `point_transactions` 대응 */
export interface PointTransaction {
  readonly id: string
  readonly amount: number
  readonly reason: PointReason
  readonly refId: string | null
  /** 운영자 조정 사유 등 메모. 스키마 추가 검토 항목 */
  readonly memo: string | null
  readonly createdAt: string
}

/** 유저 예측 성적 집계 */
export interface UserRecord {
  readonly totalPredictions: number
  readonly winHits: number
  readonly scoreHits: number
  readonly bestStreak: number
}

/** 유저 상세 화면 데이터 */
export interface UserDetail extends UserSummary {
  readonly dexProgress: readonly DexProgress[]
  readonly ownedCards: readonly OwnedCard[]
  readonly draws: readonly DrawLog[]
  readonly pointTransactions: readonly PointTransaction[]
  readonly record: UserRecord
}
