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
/**
 * 예측 마감 = 경기 시작 - 30분.
 *
 * KBO 는 타순(라인업)을 경기 시작 1시간~1시간 30분 전에 발표한다. 마감이 1시간 전이면
 * **라인업을 보고 예측할 시간이 없다.** 30분 전이면 확인한 뒤 예측할 수 있다.
 *
 * ⚠️ 값의 진짜 출처는 **DB 트리거**(`set_predict_close_at`)다. 이 상수는 **표시용**이며
 *    (어드민 규칙 화면), 마감 판정은 항상 `games.predict_close_at` 컬럼을 쓴다.
 *    둘이 어긋나면 운영자가 잘못된 값을 보게 되므로 함께 고친다.
 */
export const PREDICT_CLOSE_OFFSET_MINUTES = 30

/**
 * 예측 선택지 — 홈 / 무승부 / 원정 **3택**.
 *
 * 처음엔 홈/원정 2택이고 "무승부면 전원 미적중"이었지만, **KBO 는 무승부가 실제로 있다**
 * (크롤러 실측으로 3:3, 0:0 확인). 그러면 그 경기를 예측한 모든 유저가 아무 이유 없이
 * 손해를 본다. 그래서 무승부를 선택지로 넣었다.
 */
export const PREDICTION_PICKS = ['home', 'draw', 'away'] as const

export type PredictionPick = (typeof PREDICTION_PICKS)[number]

export const PREDICTION_PICK_LABEL: Record<PredictionPick, string> = {
  home: '홈 승',
  draw: '무승부',
  away: '원정 승',
} as const

/**
 * `void` = 무효. 우천 취소 등으로 경기가 성립하지 않은 경우다.
 *
 * 예측은 무료라(포인트를 걸지 않는다 — 통합기획서 6장) 환급이 없고, 무효로 마감만 한다.
 * 마감하지 않으면 `pending` 으로 남아 유저 화면에 "집계 중"이 영원히 표시된다.
 * DB 트리거가 취소 경기의 예측을 자동으로 `void` 로 바꾼다.
 */
export const PREDICTION_RESULTS = ['pending', 'win_hit', 'score_hit', 'miss', 'void'] as const

export type PredictionResult = (typeof PREDICTION_RESULTS)[number]

export const PREDICTION_RESULT_LABEL: Record<PredictionResult, string> = {
  pending: '대기',
  win_hit: '승패 적중',
  score_hit: '스코어 적중',
  miss: '미적중',
  void: '무효',
} as const

/** 예측 가능 여부 — 서버에서 받은 마감 시각과 서버 기준 현재 시각으로 판정 */
export const isPredictOpen = (predictCloseAt: Date, serverNow: Date): boolean =>
  serverNow.getTime() < predictCloseAt.getTime()

export const isGameSettled = (status: GameStatus): boolean => status === 'settled'

/**
 * 승패 판정 — **스코어로만 판정한다.**
 *
 * ⚠️ 소스(네이버)의 `winner` 필드를 쓰지 않는다. 경기 전(BEFORE) 경기가 전부 `DRAW` 로
 * 오기 때문에 그대로 믿으면 미실시 경기를 무승부로 처리한다(표본 225건 중 206건이 경기 전).
 *
 * KBO 는 무승부가 존재하고 **무승부도 선택지다**(`PREDICTION_PICKS`).
 * 반환값이 `PredictionPick` 과 같은 형태라서 정산 판정이 단순 비교가 된다 —
 * `settle_game()` 도 같은 방식으로 판정한다.
 */
export type GameOutcome = PredictionPick

export const outcomeOf = (homeScore: number, awayScore: number): GameOutcome => {
  if (homeScore > awayScore) return 'home'
  if (homeScore < awayScore) return 'away'
  return 'draw'
}
