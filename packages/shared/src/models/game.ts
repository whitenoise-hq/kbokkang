import type { GameStatus, PredictionPick, PredictionResult } from '../game'

/** 경기 — 통합기획서 5장 `games` 대응 */
export interface Game {
  readonly id: string
  /** YYYY-MM-DD */
  readonly gameDate: string
  readonly startAt: string
  /** 예측 마감 = startAt - 1시간 */
  readonly predictCloseAt: string
  readonly homeTeamId: number
  readonly awayTeamId: number
  readonly status: GameStatus
  readonly homeScore: number | null
  readonly awayScore: number | null
  readonly settledAt: string | null
}

/** 경기 목록 화면용 — 예측 집계 포함 */
export interface GameWithStats extends Game {
  /** 해당 경기 총 예측 수 */
  readonly predictionCount: number
  /** 홈 승 예측 수 (원정은 predictionCount - homePickCount) */
  readonly homePickCount: number
}

/** 예측 — 통합기획서 5장 `predictions` 대응 */
export interface Prediction {
  readonly id: string
  readonly userId: string
  readonly userNickname: string
  readonly gameId: string
  readonly pickWinner: PredictionPick
  readonly pickHomeScore: number | null
  readonly pickAwayScore: number | null
  readonly result: PredictionResult | null
  readonly earnedPoints: number | null
  readonly createdAt: string
}

/** 경기 목록 필터 */
export interface GameFilter {
  /** YYYY-MM-DD. null이면 전체 */
  readonly date: string | null
  readonly status: GameStatus | null
}

export const EMPTY_GAME_FILTER: GameFilter = { date: null, status: null }
