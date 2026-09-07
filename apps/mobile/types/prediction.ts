import type { PredictionPick, PredictionResult } from '@kbokkang/shared'
import type { GameTeamView } from './game'

/**
 * 예측 탭이 쓰는 뷰 모델.
 *
 * **유저가 예측한 경기만** 담는다 — 예측하지 않은 경기는 이 탭에 나오지 않는다.
 * 홈(`GameView`)과 달리 선택 상태·마감 시각이 없다. 지난 기록은 조회 전용이다.
 *
 * 6-4 에서 TanStack Query 훅이 이 모양으로 만들어 준다.
 */
export interface PredictionRowView {
  /** `predictions.id` */
  readonly id: string
  /** ISO — 정렬·그룹 기준 */
  readonly startAt: string
  readonly home: GameTeamView
  readonly away: GameTeamView
  /** 취소·집계중이면 null */
  readonly homeScore: number | null
  readonly awayScore: number | null
  readonly cancelled: boolean
  readonly pickWinner: PredictionPick
  readonly result: PredictionResult
  readonly earnedPoints: number | null
}

/** 날짜(KST `YYYY-MM-DD`)로 묶은 하루치 */
export interface PredictionDayView {
  readonly date: string
  readonly rows: readonly PredictionRowView[]
}

/** 예측 탭 상단 성적 요약 */
export interface PredictionRecordView {
  readonly totalPredictions: number
  /** 결과가 확정된 예측 수(pending·void 제외) — 적중률 분모 */
  readonly resolvedPredictions: number
  readonly hits: number
  readonly currentStreak: number
  readonly bestStreak: number
  /** 예측으로 얻은 포인트 총합 */
  readonly earnedPoints: number
}
