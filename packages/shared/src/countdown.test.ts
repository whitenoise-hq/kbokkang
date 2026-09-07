import { describe, expect, it } from 'vitest'
import {
  formatRemaining,
  IMMINENT_THRESHOLD_MS,
  isImminent,
  remainingUntil,
  type Remaining,
} from './countdown'

const at = (iso: string): Date => new Date(iso)
const minutesFromNow = (now: Date, minutes: number): Date =>
  new Date(now.getTime() + minutes * 60 * 1000)

describe('remainingUntil', () => {
  const now = at('2026-09-07T10:00:00Z')

  it('남은 시간을 시·분으로 쪼갠다', () => {
    expect(remainingUntil(minutesFromNow(now, 135), now)).toEqual({
      totalMs: 135 * 60 * 1000,
      hours: 2,
      minutes: 15,
    })
  })

  it('1시간 미만은 hours 가 0 이다', () => {
    const remaining = remainingUntil(minutesFromNow(now, 45), now)
    expect(remaining?.hours).toBe(0)
    expect(remaining?.minutes).toBe(45)
  })

  it('이미 지났으면 null — 마감이다', () => {
    expect(remainingUntil(minutesFromNow(now, -1), now)).toBeNull()
  })

  it('정확히 같은 시각도 null — 마감 시각에는 예측할 수 없다', () => {
    expect(remainingUntil(now, now)).toBeNull()
  })

  it('잘못된 날짜는 null — 화면이 NaN 을 표시하지 않게 한다', () => {
    expect(remainingUntil(new Date('없는날짜'), now)).toBeNull()
  })

  it('분 단위는 내림한다 — 59초 남았으면 0분이다', () => {
    const remaining = remainingUntil(new Date(now.getTime() + 59 * 1000), now)
    expect(remaining?.minutes).toBe(0)
  })
})

describe('formatRemaining', () => {
  const build = (totalMs: number): Remaining => ({
    totalMs,
    hours: Math.floor(totalMs / 3_600_000),
    minutes: Math.floor((totalMs % 3_600_000) / 60_000),
  })

  it('1분 미만은 초를 보여주지 않는다', () => {
    expect(formatRemaining(build(30 * 1000))).toBe('곧 마감')
  })

  it('1시간 미만은 분만', () => {
    expect(formatRemaining(build(45 * 60 * 1000))).toBe('45분 남음')
  })

  it('정확히 몇 시간이면 분을 생략한다', () => {
    expect(formatRemaining(build(2 * 3_600_000))).toBe('2시간 남음')
  })

  it('시간과 분을 함께', () => {
    expect(formatRemaining(build(135 * 60 * 1000))).toBe('2시간 15분 남음')
  })
})

describe('isImminent', () => {
  const build = (totalMs: number): Remaining => ({ totalMs, hours: 0, minutes: 0 })

  it('30분 이하면 임박이다', () => {
    expect(isImminent(build(IMMINENT_THRESHOLD_MS))).toBe(true)
    expect(isImminent(build(10 * 60 * 1000))).toBe(true)
  })

  it('30분을 넘으면 임박이 아니다', () => {
    expect(isImminent(build(IMMINENT_THRESHOLD_MS + 1))).toBe(false)
  })
})
