/**
 * 경기 / 예측 상태 정의 — 통합기획서 5·6장.
 * 예측 마감·정산 판정은 반드시 서버 시각 기준(클라이언트 시각 신뢰 금지).
 */

export const GAME_STATUSES = ['scheduled', 'closed', 'live', 'aggregating', 'settled'] as const

export type GameStatus = (typeof GAME_STATUSES)[number]

export const GAME_STATUS_LABEL: Record<GameStatus, string> = {
  scheduled: '예정',
  closed: '마감',
  live: '경기중',
  aggregating: '집계중',
  settled: '정산완료',
} as const

/** 예측 마감 시각 = 경기 시작 - 1시간 */
export const PREDICT_CLOSE_OFFSET_MINUTES = 60

export const PREDICTION_PICKS = ['home', 'away'] as const

export type PredictionPick = (typeof PREDICTION_PICKS)[number]

export const PREDICTION_RESULTS = ['pending', 'win_hit', 'score_hit', 'miss'] as const

export type PredictionResult = (typeof PREDICTION_RESULTS)[number]

export const PREDICTION_RESULT_LABEL: Record<PredictionResult, string> = {
  pending: '대기',
  win_hit: '승패 적중',
  score_hit: '스코어 적중',
  miss: '미적중',
} as const

/** 예측 가능 여부 — 서버에서 받은 마감 시각과 서버 기준 현재 시각으로 판정 */
export const isPredictOpen = (predictCloseAt: Date, serverNow: Date): boolean =>
  serverNow.getTime() < predictCloseAt.getTime()

export const isGameSettled = (status: GameStatus): boolean => status === 'settled'
