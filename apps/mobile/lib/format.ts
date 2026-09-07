/**
 * 표시용 포맷.
 *
 * ⚠️ 모든 시각은 **KST 로 표시**한다. 기기 타임존을 따라가면 해외에서 경기 시각이 어긋난다.
 */
const KST = 'Asia/Seoul'

const timeFormatter = new Intl.DateTimeFormat('ko-KR', {
  timeZone: KST,
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

const dateFormatter = new Intl.DateTimeFormat('ko-KR', {
  timeZone: KST,
  month: 'long',
  day: 'numeric',
  weekday: 'short',
})

/** `18:30` */
export const formatTime = (iso: string): string => timeFormatter.format(new Date(iso))

/** `9월 7일 (월)` */
export const formatDateWithWeekday = (iso: string): string => dateFormatter.format(new Date(iso))

/** 포인트는 자릿수 구분. 숫자 정렬은 `tabular` 스타일과 함께 쓴다 */
export const formatPoints = (points: number): string => `${points.toLocaleString('ko-KR')}P`
