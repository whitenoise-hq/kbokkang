/**
 * 예측 마감까지 남은 시간 계산.
 *
 * ⚠️ **마감 판정은 서버 시각 기준이다**(앱기획서 4장). 여기 함수들은 `now` 를 **인자로 받는다** —
 * 내부에서 `new Date()` 를 부르지 않는다. 앱은 서버 시각 보정을 거친 `now` 를 넘겨야 한다.
 *
 * ⚠️ 화면에서 남은 시간을 모듈 상수로 계산하지 말 것. 자정을 넘겨 앱을 재개하면 값이
 * 고정된다(플레이북 8번). 매초 갱신되는 훅에서 이 함수를 부른다.
 */

const MINUTE_MS = 60 * 1000
const HOUR_MS = 60 * MINUTE_MS

export interface Remaining {
  readonly totalMs: number
  readonly hours: number
  readonly minutes: number
}

/** 남은 시간. 이미 지났으면 null(= 마감) */
export const remainingUntil = (target: Date, now: Date): Remaining | null => {
  const totalMs = target.getTime() - now.getTime()
  if (Number.isNaN(totalMs) || totalMs <= 0) return null

  return {
    totalMs,
    hours: Math.floor(totalMs / HOUR_MS),
    minutes: Math.floor((totalMs % HOUR_MS) / MINUTE_MS),
  }
}

/**
 * 표시용 문자열.
 *
 * 초 단위는 보여주지 않는다 — 1분 미만은 "곧 마감"으로 뭉갠다.
 * 초를 보여주면 매초 리렌더가 눈에 띄고, 마감이 임박했다는 사실만 전달되면 충분하다.
 */
export const formatRemaining = (remaining: Remaining): string => {
  if (remaining.totalMs < MINUTE_MS) return '곧 마감'
  if (remaining.hours === 0) return `${String(remaining.minutes)}분 남음`
  if (remaining.minutes === 0) return `${String(remaining.hours)}시간 남음`
  return `${String(remaining.hours)}시간 ${String(remaining.minutes)}분 남음`
}

/** 마감이 임박했는지 — 시간을 강조 표시할 기준(앱기획서 3.2 "마감 임박은 시간 강조") */
export const IMMINENT_THRESHOLD_MS = 30 * MINUTE_MS

export const isImminent = (remaining: Remaining): boolean =>
  remaining.totalMs <= IMMINENT_THRESHOLD_MS
