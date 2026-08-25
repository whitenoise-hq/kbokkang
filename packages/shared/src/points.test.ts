import { describe, expect, it } from 'vitest'
import { CARD_GRADES, gradeRank } from './grades'
import { CARD_SELL_PRICE, duplicateRefundOf, sellPriceOf, sellableCount } from './points'
import { DRAW_COST_SINGLE } from './draw'

describe('판매가 / 환급가', () => {
  it('등급이 높을수록 판매가가 높다', () => {
    const sorted = [...CARD_GRADES].sort((a, b) => gradeRank(a) - gradeRank(b))
    const prices = sorted.map(sellPriceOf)
    expect(prices).toEqual([...prices].sort((a, b) => a - b))
  })

  it('중복 환급가는 판매가와 같다', () => {
    for (const grade of CARD_GRADES) {
      expect(duplicateRefundOf(grade)).toBe(CARD_SELL_PRICE[grade])
    }
  })

  it('판매가는 뽑기 1회 비용보다 훨씬 낮다(포인트가 계속 소모되도록)', () => {
    for (const grade of CARD_GRADES) {
      expect(sellPriceOf(grade)).toBeLessThan(DRAW_COST_SINGLE.normal)
    }
  })
})

describe('sellableCount', () => {
  it('도감 마지막 1장은 판매 불가', () => {
    expect(sellableCount(1)).toBe(0)
    expect(sellableCount(3)).toBe(2)
  })

  it('보유 0장이면 판매 가능 수량도 0', () => {
    expect(sellableCount(0)).toBe(0)
  })
})
