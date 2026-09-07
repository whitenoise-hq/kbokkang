import { kstDateOf } from '@kbokkang/shared'

/**
 * 표시용 포맷.
 *
 * ⚠️ 모든 시각은 **KST 로 표시**한다. 기기 타임존을 따라가면 해외에서 경기 시각이 어긋난다.
 *
 * KST 날짜 계산 자체는 shared(`kstDateOf`)에 있다 — 어드민·연승 집계도 같은 함수를
 * 써야 날짜 경계가 어긋나지 않는다. 화면에서 쓰기 편하도록 여기서 재노출한다.
 */
const KST = 'Asia/Seoul'

export { kstDateOf }

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

const DAY_MS = 24 * 60 * 60 * 1000

/**
 * 날짜 그룹 헤더 — `어제` / `9월 5일 (금)`.
 *
 * 어제는 **날짜 대신 "어제"** 로 쓴다. 예측 탭에 오는 가장 큰 이유가 어제 결과 확인이라
 * 날짜를 읽어서 오늘과 비교하게 만들 필요가 없다. 오늘도 함께 처리한다 —
 * 예측 탭은 지난 기록만 보여주지만, 정산이 늦어 오늘 경기가 섞이는 경우가 있다.
 *
 * `now` 를 인자로 받는다 — 내부에서 `new Date()` 를 부르면 서버 시각 보정이 무시된다.
 */
export const formatDayLabel = (date: string, now: Date): string => {
  const today = kstDateOf(now)
  if (date === today) return '오늘'
  if (date === kstDateOf(new Date(now.getTime() - DAY_MS))) return '어제'

  return formatDateWithWeekday(`${date}T00:00:00+09:00`)
}
