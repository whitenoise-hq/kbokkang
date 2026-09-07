import type { PredictionResult } from './game'
import { kstDateOf } from './kst'

/**
 * 예측 성적 계산 — 적중률·연승.
 *
 * 앱(예측 탭)과 어드민(유저 상세)이 **같은 숫자**를 보여야 한다. 두 곳에서 따로 세면
 * 운영자가 유저와 다른 성적을 보게 된다. 그래서 판정을 여기 한 곳에 둔다.
 *
 * ## `pending` 과 `void` 는 성적에 넣지 않는다
 *
 * - `pending`(정산 전)은 **아직 결과가 없다.** 분모에 넣으면 경기 종료 직후 적중률이
 *   떨어진 것처럼 보인다.
 * - `void`(우천 취소로 무효)는 **유저 탓이 아니다.** 분모에 넣으면 예측을 잘 했는데
 *   비가 와서 적중률이 깎이고, 연승도 끊긴다.
 */

/** 적중인가 — 승패 적중과 스코어 적중 모두 적중이다 */
export const isHit = (result: PredictionResult): boolean =>
  result === 'win_hit' || result === 'score_hit'

/** 결과가 확정됐는가 — 적중률 분모로 쓴다 */
export const isResolved = (result: PredictionResult): boolean =>
  result !== 'pending' && result !== 'void'

/**
 * 적중률(0~1). 확정된 예측이 없으면 **null** 이다 — 0 을 돌려주면 신규 유저에게
 * "적중률 0%" 로 보여서 실패한 것처럼 읽힌다. 화면은 null 을 `–` 로 표시한다.
 */
export const hitRate = (hits: number, resolved: number): number | null =>
  resolved === 0 ? null : hits / resolved

/**
 * ## 연승은 **하루 단위**다 — "그날 예측을 전부 맞힌 날"의 연속
 *
 * 경기 단위(연속 적중 경기 수)로 세다가 바꿨다. **평일 KBO 5경기는 전부 18:30 시작**이라
 * 시작 시각으로는 그 5경기의 순서가 정해지지 않는다. 그러면 같은 데이터에서도
 * 최고 연승이 달라진다 — `적중 미적중 적중 적중 적중` 은 3, `적중 적중 적중 적중 미적중`
 * 은 4 다. DB 반환 순서에 값이 좌우되는 **재현 불가능한 성적**이었다(실제 버그였다).
 *
 * 하루 단위는 그 문제가 원인부터 사라지고, 유저가 화면(날짜별 묶음)만 보고 검산할 수 있다.
 *
 * 판정 규칙:
 * - **그날 확정된 예측 전부가 적중**이면 전승이다. 하나라도 틀리면 끊긴다.
 * - 확정된 예측이 **하나도 없는 날**(전부 취소·집계중)은 **건너뛴다** — 끊지 않는다.
 *   비가 와서 연승이 사라지면 유저 탓이 아닌 이유로 기록이 없어진다.
 * - **예측하지 않은 날도 끊지 않는다.** 데이터에 그 날짜가 아예 없으므로 자동으로
 *   건너뛴다. 하루 앱을 안 열었다고 기록이 사라지면 안 된다(예측은 무료다).
 */
export interface DayPredictions {
  /** KST `YYYY-MM-DD` */
  readonly date: string
  readonly results: readonly PredictionResult[]
}

/**
 * 그날 전승했는가. 판정할 수 없으면(확정된 예측이 없으면) **null**.
 * null 과 false 를 구분해야 한다 — null 은 연속을 끊지 않고 false 는 끊는다.
 */
export const sweptDay = (results: readonly PredictionResult[]): boolean | null => {
  const resolved = results.filter(isResolved)
  if (resolved.length === 0) return null

  return resolved.every(isHit)
}

/**
 * 날짜 오름차순으로 정렬한다. **정렬을 호출자에게 맡기지 않는다** — 경기 단위였을 때
 * 호출자 정렬(어드민 쿼리에 `ORDER BY` 가 없었다)에 값이 좌우되는 버그가 있었다.
 */
const orderedByDate = (days: readonly DayPredictions[]): readonly DayPredictions[] =>
  [...days].sort((a, b) => a.date.localeCompare(b.date))

/** 최고 전승 연속 일수 */
export const bestStreak = (days: readonly DayPredictions[]): number => {
  let best = 0
  let current = 0

  for (const day of orderedByDate(days)) {
    const swept = sweptDay(day.results)
    if (swept === null) continue

    if (swept) {
      current += 1
      best = Math.max(best, current)
    } else {
      current = 0
    }
  }

  return best
}

/**
 * 현재 전승 연속 일수 — 최근 날짜부터 거꾸로 센다.
 *
 * 오늘 경기가 아직 정산되지 않았어도 연승이 0 으로 보이지 않는다(그날은 판정 불가라
 * 건너뛴다).
 */
export const currentStreak = (days: readonly DayPredictions[]): number => {
  const ordered = orderedByDate(days)
  let streak = 0

  for (let index = ordered.length - 1; index >= 0; index -= 1) {
    const day = ordered[index]
    if (day === undefined) continue

    const swept = sweptDay(day.results)
    if (swept === null) continue
    if (!swept) break

    streak += 1
  }

  return streak
}

/**
 * 예측 목록을 **KST 날짜별로** 묶는다. 연승이 하루 단위이므로 계산 전에 반드시 거친다.
 *
 * `startAt` 은 경기 시작 시각(ISO)이다. 예측 시각이 아니라 **경기 날짜**로 묶어야
 * 화면(날짜별 묶음)과 같은 결과가 나온다.
 */
export const groupPredictionsByDay = (
  predictions: readonly { readonly startAt: string; readonly result: PredictionResult }[],
): readonly DayPredictions[] => {
  const byDate = new Map<string, PredictionResult[]>()

  for (const prediction of predictions) {
    const date = kstDateOf(new Date(prediction.startAt))
    const bucket = byDate.get(date)

    if (bucket === undefined) byDate.set(date, [prediction.result])
    else bucket.push(prediction.result)
  }

  return [...byDate].map(([date, results]) => ({ date, results }))
}
