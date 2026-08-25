import { describe, expect, it } from 'vitest'
import { CARD_GRADES } from './grades'
import { COLORS, RADIUS, SPACING, TYPOGRAPHY, gradeColor } from './theme'

/** 04_앱디자인가이드.md 1장 등급색 — 값이 바뀌면 가이드와 동시에 갱신할 것 */
const GUIDE_GRADE_COLORS = {
  normal: '#8B95A1',
  rare: '#4A90D9',
  epic: '#9B51E0',
  legend: '#F2A900',
  mythic: '#E03131',
} as const

describe('디자인 가이드 정합성', () => {
  it.each(CARD_GRADES)('%s 등급색이 디자인 가이드와 일치한다', (grade) => {
    expect(gradeColor(grade)).toBe(GUIDE_GRADE_COLORS[grade])
  })

  it('등급색은 UI 포인트 컬러(primary)와 겹치지 않는다', () => {
    const gradeColors = CARD_GRADES.map(gradeColor)
    expect(gradeColors).not.toContain(COLORS.primary)
  })

  it('모든 색 토큰은 hex 또는 rgba 형식이다', () => {
    for (const value of Object.values(COLORS)) {
      expect(value).toMatch(/^#[0-9A-F]{6}$/i)
    }
  })
})

describe('토큰 스케일', () => {
  it('spacing은 4px 단위다', () => {
    for (const value of Object.values(SPACING)) {
      expect(value % 4).toBe(0)
    }
  })

  it('radius는 sm < md < lg < full 순서다', () => {
    expect(RADIUS.sm).toBeLessThan(RADIUS.md)
    expect(RADIUS.md).toBeLessThan(RADIUS.lg)
    expect(RADIUS.lg).toBeLessThan(RADIUS.full)
  })

  it('타입 스케일은 display가 가장 크고 caption이 가장 작다', () => {
    const sizes = Object.values(TYPOGRAPHY).map((style) => style.fontSize)
    expect(TYPOGRAPHY.display.fontSize).toBe(Math.max(...sizes))
    expect(TYPOGRAPHY.caption.fontSize).toBe(Math.min(...sizes))
  })
})
