/**
 * 크롤러의 모든 날짜 계산은 KST 기준이다.
 *
 * GitHub Actions 는 UTC 로 돌기 때문에 `new Date()` 의 로컬 날짜를 쓰면 하루가 밀린다.
 * (KST 09:00 이전 = UTC 전날)
 */

const KST_OFFSET_MS = 9 * 60 * 60 * 1000

/** 지금(KST) 날짜 — YYYY-MM-DD */
export const todayKst = (): string =>
  new Date(Date.now() + KST_OFFSET_MS).toISOString().slice(0, 10)

/** ISO 날짜를 일 단위로 이동 */
export const shiftDate = (isoDate: string, days: number): string => {
  const shifted = new Date(Date.parse(`${isoDate}T00:00:00Z`) + days * 86400000)
  return shifted.toISOString().slice(0, 10)
}

/** from 부터 days 일치 날짜 목록(from 포함) */
export const dateRange = (from: string, days: number): readonly string[] =>
  Array.from({ length: days }, (_, index) => shiftDate(from, index))

/**
 * 소스가 주는 `gameDateTime`("2026-09-01T18:30:00", 타임존 표기 없음)을 KST 로 해석해
 * UTC ISO 문자열로 바꾼다. 표기가 없다고 UTC 로 읽으면 9시간 밀린다.
 */
export const kstDateTimeToUtcIso = (naverDateTime: string): string => {
  const withZone = `${naverDateTime}+09:00`
  const parsed = new Date(withZone)

  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`경기 시각을 해석할 수 없습니다: ${naverDateTime}`)
  }

  return parsed.toISOString()
}
