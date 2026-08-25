import { describe, expect, it } from 'vitest'
import { CARD_TYPES, CARD_TYPE_LABEL, isCardType } from './card-types'
import { CARD_GRADES, CARD_GRADE_BY_PREFIX, CARD_GRADE_META, isCardGrade } from './grades'
import { isDrawType } from './draw'

describe('등급 가드', () => {
  it('정의된 등급만 통과', () => {
    for (const grade of CARD_GRADES) {
      expect(isCardGrade(grade)).toBe(true)
    }
    expect(isCardGrade('ultra')).toBe(false)
    expect(isCardGrade(1)).toBe(false)
    expect(isCardGrade(null)).toBe(false)
  })

  it('접두어는 등급마다 유일하다', () => {
    const prefixes = CARD_GRADES.map((grade) => CARD_GRADE_META[grade].prefix)
    expect(new Set(prefixes).size).toBe(CARD_GRADES.length)
  })

  it('접두어 역방향 조회가 원래 등급을 돌려준다', () => {
    for (const grade of CARD_GRADES) {
      expect(CARD_GRADE_BY_PREFIX[CARD_GRADE_META[grade].prefix]).toBe(grade)
    }
  })

  it('레전드·신화만 풀아트 + 반짝임이다', () => {
    for (const grade of CARD_GRADES) {
      const isTop = grade === 'legend' || grade === 'mythic'
      expect(CARD_GRADE_META[grade].hasShimmer).toBe(isTop)
      expect(CARD_GRADE_META[grade].layout).toBe(isTop ? 'full_art' : 'boxed')
    }
  })
})

describe('카드 종류 가드', () => {
  it('정의된 종류만 통과', () => {
    for (const type of CARD_TYPES) {
      expect(isCardType(type)).toBe(true)
    }
    expect(isCardType('coach')).toBe(false)
    expect(isCardType(undefined)).toBe(false)
  })

  it('모든 종류에 라벨이 있다', () => {
    for (const type of CARD_TYPES) {
      expect(CARD_TYPE_LABEL[type]).toBeTruthy()
    }
  })
})

describe('뽑기 종류 가드', () => {
  it('normal/premium만 통과', () => {
    expect(isDrawType('normal')).toBe(true)
    expect(isDrawType('premium')).toBe(true)
    expect(isDrawType('free')).toBe(false)
    expect(isDrawType({})).toBe(false)
  })
})
