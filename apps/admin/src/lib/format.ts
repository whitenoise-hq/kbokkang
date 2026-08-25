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
