import { describe, expect, it } from 'vitest'
import { CARD_GRADES } from './grades'
import { formatDexNo, nextDexNo, parseDexNo } from './dex'

describe('formatDexNo', () => {
  it('등급 접두어 + 2자리 순번으로 만든다', () => {
    expect(formatDexNo({ grade: 'normal', seq: 1 })).toBe('N01')
    expect(formatDexNo({ grade: 'epic', seq: 6 })).toBe('E06')
    expect(formatDexNo({ grade: 'mythic', seq: 12 })).toBe('M12')
  })

  it('순번이 1 미만이거나 정수가 아니면 던진다', () => {
    expect(() => formatDexNo({ grade: 'normal', seq: 0 })).toThrow()
    expect(() => formatDexNo({ grade: 'normal', seq: -1 })).toThrow()
    expect(() => formatDexNo({ grade: 'normal', seq: 1.5 })).toThrow()
  })
})

describe('parseDexNo', () => {
  it('모든 등급을 왕복 변환한다', () => {
    for (const grade of CARD_GRADES) {
      const dexNo = formatDexNo({ grade, seq: 7 })
      expect(parseDexNo(dexNo)).toEqual({ grade, seq: 7 })
    }
  })

  it('형식이 틀리면 null', () => {
    expect(parseDexNo('N1')).toBeNull()
    expect(parseDexNo('X01')).toBeNull()
    expect(parseDexNo('n01')).toBeNull()
    expect(parseDexNo('')).toBeNull()
  })
})

describe('nextDexNo', () => {
  it('기존 장수 + 1 번호를 준다', () => {
    expect(nextDexNo('epic', 5)).toBe('E06')
    expect(nextDexNo('normal', 0)).toBe('N01')
  })
})
