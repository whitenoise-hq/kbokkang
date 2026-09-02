import { describe, expect, it } from 'vitest'
import { dateRange, kstDateTimeToUtcIso, shiftDate } from './date'

describe('kstDateTimeToUtcIso', () => {
  it('타임존 표기가 없는 소스 시각을 KST 로 해석한다', () => {
    // 2026-09-01 18:30 KST = 09:30 UTC
    expect(kstDateTimeToUtcIso('2026-09-01T18:30:00')).toBe('2026-09-01T09:30:00.000Z')
  })

  it('KST 자정 이전 경기는 UTC 로 같은 날이다', () => {
    expect(kstDateTimeToUtcIso('2026-09-01T14:00:00')).toBe('2026-09-01T05:00:00.000Z')
  })

  it('KST 오전 경기는 UTC 로 전날이 된다', () => {
    // 2026-03-16 13:00 KST = 2026-03-16 04:00 UTC (아직 같은 날)
    expect(kstDateTimeToUtcIso('2026-03-16T13:00:00')).toBe('2026-03-16T04:00:00.000Z')
    // KST 08:00 이면 UTC 전날 23:00
    expect(kstDateTimeToUtcIso('2026-03-16T08:00:00')).toBe('2026-03-15T23:00:00.000Z')
  })

  it('해석할 수 없는 값은 던진다 — 조용히 잘못된 시각을 쓰지 않는다', () => {
    expect(() => kstDateTimeToUtcIso('없는날짜')).toThrow()
  })
})

describe('shiftDate', () => {
  it('월요일 실행일 포함 7일치 범위를 만든다', () => {
    // 2026-09-07 은 월요일
    expect(shiftDate('2026-09-07', 6)).toBe('2026-09-13')
  })

  it('월 경계를 넘긴다', () => {
    expect(shiftDate('2026-09-28', 6)).toBe('2026-10-04')
  })

  it('연 경계를 넘긴다', () => {
    expect(shiftDate('2026-12-29', 6)).toBe('2027-01-04')
  })

  it('음수로 과거로 이동한다 — 정산 잡의 조회 시작일을 이렇게 구한다', () => {
    expect(shiftDate('2026-09-02', -2)).toBe('2026-08-31')
  })

  it('음수로 월 경계를 거꾸로 넘긴다', () => {
    expect(shiftDate('2026-03-01', -2)).toBe('2026-02-27')
  })
})

describe('dateRange', () => {
  it('시작일을 포함해 7일을 만든다', () => {
    expect(dateRange('2026-09-07', 7)).toEqual([
      '2026-09-07',
      '2026-09-08',
      '2026-09-09',
      '2026-09-10',
      '2026-09-11',
      '2026-09-12',
      '2026-09-13',
    ])
  })

  it('하루면 시작일만 돌려준다', () => {
    expect(dateRange('2026-09-01', 1)).toEqual(['2026-09-01'])
  })

  it('월 경계를 넘긴다', () => {
    expect(dateRange('2026-09-30', 3)).toEqual(['2026-09-30', '2026-10-01', '2026-10-02'])
  })
})
