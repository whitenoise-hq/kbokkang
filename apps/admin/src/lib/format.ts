/** 어드민 공통 표시 포맷. 서버 시각(UTC ISO) → KST 표기. */

const KST = 'Asia/Seoul'

const dateFormatter = new Intl.DateTimeFormat('ko-KR', {
  timeZone: KST,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

const dateTimeFormatter = new Intl.DateTimeFormat('ko-KR', {
  timeZone: KST,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

const timeFormatter = new Intl.DateTimeFormat('ko-KR', {
  timeZone: KST,
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

export const formatDate = (iso: string): string => dateFormatter.format(new Date(iso))

export const formatDateTime = (iso: string): string => dateTimeFormatter.format(new Date(iso))

export const formatTime = (iso: string): string => timeFormatter.format(new Date(iso))

export const formatNumber = (value: number): string => value.toLocaleString('ko-KR')

/** 포인트 표기 — 부호를 항상 붙인다 */
export const formatSignedPoints = (value: number): string =>
  `${value > 0 ? '+' : ''}${formatNumber(value)}p`

export const formatPoints = (value: number): string => `${formatNumber(value)}p`

export const formatPercent = (value: number, digits = 1): string => `${value.toFixed(digits)}%`

/** 진행률 0~100 */
export const toPercent = (owned: number, total: number): number =>
  total === 0 ? 0 : (owned / total) * 100

/**
 * KST 기준 오늘 (YYYY-MM-DD).
 * timeZone 을 고정하므로 서버(UTC)와 클라이언트에서 같은 값이 나온다(하이드레이션 불일치 방지).
 */
const isoDateFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: KST })

export const todayInKst = (): string => isoDateFormatter.format(new Date())

/** ISO 날짜(YYYY-MM-DD)를 일 단위로 이동. 월/연 경계를 알아서 넘긴다. */
export const shiftIsoDate = (isoDate: string, days: number): string => {
  const [year, month, day] = isoDate.split('-').map(Number)
  if (year === undefined || month === undefined || day === undefined) return isoDate

  const shifted = new Date(year, month - 1, day + days)
  return `${String(shifted.getFullYear())}-${String(shifted.getMonth() + 1).padStart(2, '0')}-${String(shifted.getDate()).padStart(2, '0')}`
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'] as const

export type Weekday = (typeof WEEKDAYS)[number]

export const weekdayLabels = WEEKDAYS

/** YYYY-MM-DD → 'YYYY.MM.DD (요일)' */
export const formatDateWithWeekday = (isoDate: string): string => {
  const [year, month, day] = isoDate.split('-').map(Number)
  if (year === undefined || month === undefined || day === undefined) return isoDate

  const weekday = WEEKDAYS[new Date(year, month - 1, day).getDay()] ?? ''
  return `${String(year)}.${String(month).padStart(2, '0')}.${String(day).padStart(2, '0')} (${weekday})`
}
