import { describe, expect, it } from 'vitest'
import { targetDate } from './args'
import { todayKst } from '../../../supabase/functions/_shared/date.ts'

describe('targetDate', () => {
  it('인자가 없으면 오늘(KST)이다', () => {
    expect(targetDate([])).toBe(todayKst())
  })

  it('빈 값도 오늘로 본다 — Actions 에서 --date= 가 그대로 들어올 수 있다', () => {
    expect(targetDate(['--date='])).toBe(todayKst())
  })

  it('넘긴 날짜를 그대로 쓴다', () => {
    expect(targetDate(['--date=2026-08-25'])).toBe('2026-08-25')
  })

  it('형식이 틀리면 던진다 — 잘못된 날짜로 DB 를 건드리지 않는다', () => {
    expect(() => targetDate(['--date=2026/08/25'])).toThrow()
    expect(() => targetDate(['--date=20260825'])).toThrow()
  })

  it('형식은 맞지만 존재하지 않는 날짜도 던진다', () => {
    expect(() => targetDate(['--date=2026-02-30'])).toThrow('존재하지 않는 날짜')
    expect(() => targetDate(['--date=2026-13-01'])).toThrow('존재하지 않는 날짜')
  })
})
