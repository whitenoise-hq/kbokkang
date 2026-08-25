import { describe, expect, it } from 'vitest'
import { CARD_GRADES, gradeRank } from './grades'
import {
  DRAW_COST_SINGLE,
  DRAW_COST_TEN,
  DRAW_TYPES,
  PREMIUM_TEN_GUARANTEE_GRADE,
  TEN_DRAW_COUNT,
  drawCost,
  gradeRateTotal,
} from './draw'

describe('확률 테이블 정합성', () => {
  it.each(DRAW_TYPES)('%s 뽑기 등급 확률 합계는 100%%', (drawType) => {
    expect(gradeRateTotal(drawType)).toBeCloseTo(100, 6)
  })
})

describe('뽑기 비용', () => {
  it.each(DRAW_TYPES)('%s 10연차는 1장 x10 보다 싸다', (drawType) => {
    expect(DRAW_COST_TEN[drawType]).toBeLessThan(DRAW_COST_SINGLE[drawType] * TEN_DRAW_COUNT)
  })

  it('장수에 맞는 비용을 반환한다', () => {
    expect(drawCost('normal', 1)).toBe(100)
    expect(drawCost('normal', TEN_DRAW_COUNT)).toBe(950)
    expect(drawCost('premium', 1)).toBe(300)
    expect(drawCost('premium', TEN_DRAW_COUNT)).toBe(2850)
  })
})

describe('등급 순서', () => {
  it('낮은 등급 → 높은 등급 순으로 rank가 증가한다', () => {
    const ranks = CARD_GRADES.map(gradeRank)
    expect(ranks).toEqual([...ranks].sort((a, b) => a - b))
  })

  it('프리미엄 10연차 보장 등급은 에픽 이상이다', () => {
    expect(gradeRank(PREMIUM_TEN_GUARANTEE_GRADE)).toBeGreaterThanOrEqual(gradeRank('epic'))
  })
})
