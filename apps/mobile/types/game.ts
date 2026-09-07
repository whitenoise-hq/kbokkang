import type { GameStatus, PredictionPick, PredictionResult } from '@kbokkang/shared'

/**
 * 홈 화면이 쓰는 경기 뷰 모델.
 *
 * `games` + `teams` + 내 `predictions` 를 합친 형태다. 6-4 에서 TanStack Query 훅이
 * 이 모양으로 만들어 준다 — 화면은 이 타입만 의존하므로 목업 → 실데이터 교체 시
 * 화면 코드가 바뀌지 않는다(어드민 Repository 경계와 같은 방식).
 */
export interface GameTeamView {
  readonly shortName: string
  /** `teams.color` — #RRGGBB */
  readonly color: string
}

export interface MyPredictionView {
  readonly pickWinner: PredictionPick
  /**
   * 스코어 예측. **입력 UI 는 보류**라 앱에서는 항상 null 이다(`GameCard` 주석 참고).
   * DB·정산이 이미 받으므로 필드는 남겨둔다 — 켤 때 화면만 붙이면 된다.
   */
  readonly pickHomeScore: number | null
  readonly pickAwayScore: number | null
  readonly result: PredictionResult
  readonly earnedPoints: number | null
}

export interface GameView {
  readonly id: string
  /** ISO */
  readonly startAt: string
  /** ISO — 시작 30분 전 */
  readonly predictCloseAt: string
  readonly status: GameStatus
  readonly cancelled: boolean
  readonly home: GameTeamView
  readonly away: GameTeamView
  readonly homeScore: number | null
  readonly awayScore: number | null
  /** 내 예측. 아직 안 했으면 null */
  readonly myPrediction: MyPredictionView | null
}
