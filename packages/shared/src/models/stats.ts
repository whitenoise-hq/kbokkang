import type { CardGrade } from '../grades'
import type { DrawType } from '../draw'
import type { CardGradeCount } from './card'

/** 대시보드 요약 지표 — 어드민 기획서 3.2 */
export interface DashboardSummary {
  readonly totalUsers: number
  readonly activeUsersToday: number
  readonly totalCards: number
  readonly cardsByGrade: readonly CardGradeCount[]
  readonly drawsToday: number
  readonly gamesToday: number
  readonly gamesSettledToday: number
  readonly pointsIssuedToday: number
  readonly pointsSpentToday: number
}

/** 설정 확률 vs 실제 분포 — 확률 검증용 */
export interface GradeRateActual {
  readonly grade: CardGrade
  /** 설정 확률(%) */
  readonly expectedRate: number
  /** 실제 분포(%) */
  readonly actualRate: number
  readonly drawCount: number
}

/** 카드별 보유 현황 — 어떤 카드가 많이/적게 풀렸는지 */
export interface CardSpreadRow {
  readonly cardId: string
  readonly dexNo: string
  readonly name: string
  readonly grade: CardGrade
  /** 보유 유저 수 */
  readonly ownerCount: number
  /** 총 발급 장수(중복 포함) */
  readonly issuedCount: number
}

/** 포인트 유입/소비 일별 추이 */
export interface PointFlowPoint {
  /** YYYY-MM-DD */
  readonly date: string
  readonly issued: number
  readonly spent: number
}

export interface DrawStats {
  readonly drawType: DrawType
  readonly rates: readonly GradeRateActual[]
}
