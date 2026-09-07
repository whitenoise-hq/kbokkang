import { describe, expect, it } from 'vitest'
import {
  bestStreak,
  currentStreak,
  groupPredictionsByDay,
  hitRate,
  isHit,
  isResolved,
  sweptDay,
  type DayPredictions,
} from './record'
import type { PredictionResult } from './game'

const H: PredictionResult = 'win_hit'
const S: PredictionResult = 'score_hit'
const M: PredictionResult = 'miss'
const P: PredictionResult = 'pending'
const V: PredictionResult = 'void'

/** `d(1, H, M)` = 9월 1일에 적중·미적중 */
const d = (day: number, ...results: PredictionResult[]): DayPredictions => ({
  date: `2026-09-${String(day).padStart(2, '0')}`,
  results,
})

describe('적중 판정', () => {
  it('승패 적중과 스코어 적중 모두 적중이다', () => {
    expect(isHit(H)).toBe(true)
    expect(isHit(S)).toBe(true)
    expect(isHit(M)).toBe(false)
    expect(isHit(P)).toBe(false)
    expect(isHit(V)).toBe(false)
  })

  it('pending·void 는 결과가 확정되지 않은 것으로 본다', () => {
    expect(isResolved(P)).toBe(false)
    expect(isResolved(V)).toBe(false)
    expect(isResolved(H)).toBe(true)
    expect(isResolved(M)).toBe(true)
  })
})

describe('그날 전승 판정', () => {
  it('확정된 예측 전부가 적중이면 전승이다', () => {
    expect(sweptDay([H, H, S])).toBe(true)
  })

  it('하나라도 틀리면 전승이 아니다', () => {
    expect(sweptDay([H, H, M])).toBe(false)
  })

  it('취소·집계중은 판정에서 빠진다 — 나머지가 전부 적중이면 전승이다', () => {
    expect(sweptDay([H, V, P])).toBe(true)
  })

  it('확정된 예측이 없으면 판정할 수 없다(null) — 연속을 끊지 않는다', () => {
    expect(sweptDay([V, P])).toBeNull()
    expect(sweptDay([])).toBeNull()
  })
})

describe('최고 연승 — 하루 단위 전승', () => {
  it('전승한 날이 연속된 최대 길이다', () => {
    expect(bestStreak([d(1, H, H), d(2, H), d(3, H, M), d(4, H)])).toBe(2)
  })

  it('그날 하나라도 틀리면 끊긴다 — 경기 수와 무관하다', () => {
    // 5경기 중 4경기를 맞혀도 전승이 아니다
    expect(bestStreak([d(1, H, H, H, H, M)])).toBe(0)
  })

  it('경기를 많이 맞힌 날도 1일이다 — 하루 단위이기 때문이다', () => {
    expect(bestStreak([d(1, H, H, H, H, H)])).toBe(1)
  })

  it('예측이 없으면 0 이다', () => {
    expect(bestStreak([])).toBe(0)
  })

  it('전부 취소된 날은 연속을 끊지 않는다', () => {
    expect(bestStreak([d(1, H), d(2, V, V), d(3, H)])).toBe(2)
  })

  it('정산 전인 날도 연속을 끊지 않는다', () => {
    expect(bestStreak([d(1, H), d(2, P), d(3, H)])).toBe(2)
  })

  it('예측하지 않은 날(데이터에 없는 날짜)은 연속을 끊지 않는다', () => {
    // 9월 2일은 예측 자체를 하지 않았다
    expect(bestStreak([d(1, H), d(3, H)])).toBe(2)
  })

  it('입력 순서가 뒤섞여도 결과가 같다 — 날짜로 정렬한다', () => {
    const days = [d(3, M), d(1, H), d(2, H)]
    expect(bestStreak(days)).toBe(2)
    expect(bestStreak([...days].reverse())).toBe(2)
  })

  it('경기 단위였을 때의 재현 불가 문제가 없다 — 같은 날 순서가 값을 바꾸지 못한다', () => {
    // 18:30 동시 시작 5경기. 경기 단위라면 순서에 따라 3 또는 4 가 나왔다
    expect(bestStreak([d(1, H, M, H, H, H)])).toBe(0)
    expect(bestStreak([d(1, H, H, H, H, M)])).toBe(0)
  })
})

describe('현재 연승', () => {
  it('최근 날짜부터 거꾸로 센다', () => {
    expect(currentStreak([d(1, M), d(2, H), d(3, H)])).toBe(2)
  })

  it('가장 최근에 판정된 날이 전승이 아니면 0 이다', () => {
    expect(currentStreak([d(1, H), d(2, H), d(3, M)])).toBe(0)
  })

  it('오늘 경기가 아직 정산 전이면 연승이 사라지지 않는다', () => {
    expect(currentStreak([d(1, H), d(2, H), d(3, P, P)])).toBe(2)
  })

  it('예측이 없으면 0 이다', () => {
    expect(currentStreak([])).toBe(0)
    expect(currentStreak([d(1, V)])).toBe(0)
  })

  it('최고 연승과 달리 과거 기록을 보지 않는다', () => {
    const days = [d(1, H), d(2, H), d(3, H), d(4, M), d(5, H)]
    expect(bestStreak(days)).toBe(3)
    expect(currentStreak(days)).toBe(1)
  })
})

describe('날짜별 묶기', () => {
  it('경기 시작 시각을 KST 날짜로 묶는다', () => {
    const days = groupPredictionsByDay([
      { startAt: '2026-09-01T09:30:00Z', result: H }, // KST 09-01 18:30
      { startAt: '2026-09-01T09:30:00Z', result: M },
      { startAt: '2026-09-02T08:00:00Z', result: H }, // KST 09-02 17:00
    ])

    expect(days).toHaveLength(2)
    expect(days.find((day) => day.date === '2026-09-01')?.results).toEqual([H, M])
    expect(days.find((day) => day.date === '2026-09-02')?.results).toEqual([H])
  })

  it('UTC 자정을 넘는 경기도 KST 날짜로 묶인다', () => {
    // KST 09-02 00:30 = UTC 09-01 15:30. UTC 로 묶으면 9월 1일이 된다
    const days = groupPredictionsByDay([{ startAt: '2026-09-01T15:30:00Z', result: H }])
    expect(days[0]?.date).toBe('2026-09-02')
  })

  it('예측이 없으면 빈 배열이다', () => {
    expect(groupPredictionsByDay([])).toEqual([])
  })
})

describe('적중률', () => {
  it('확정된 예측 대비 적중 비율이다', () => {
    expect(hitRate(12, 20)).toBe(0.6)
  })

  it('확정된 예측이 없으면 null 이다 — 신규 유저에게 0% 를 보여주지 않는다', () => {
    expect(hitRate(0, 0)).toBeNull()
  })

  it('전부 미적중이면 0 이다(null 이 아니다)', () => {
    expect(hitRate(0, 5)).toBe(0)
  })
})
