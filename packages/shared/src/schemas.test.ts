import { describe, expect, it } from 'vitest'
import {
  cardInputSchema,
  dexNoSchema,
  drawRequestSchema,
  gameSettleSchema,
  pointAdjustSchema,
  predictionInputSchema,
  teamUpdateSchema,
} from './schemas'

const GAME_ID = '4f8c1b1e-2c3d-4a5b-9c8d-7e6f5a4b3c2d'
const USER_ID = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d'

describe('cardInputSchema', () => {
  const valid = {
    name: '루키 타자',
    grade: 'epic',
    type: 'player',
    imageUrl: 'https://example.supabase.co/storage/v1/object/public/cards/e01.png',
  }

  it('drawWeight·isSeason 기본값을 채운다', () => {
    const parsed = cardInputSchema.parse(valid)
    expect(parsed.drawWeight).toBe(1)
    expect(parsed.isSeason).toBe(false)
  })

  it('이름 앞뒤 공백을 제거한다', () => {
    expect(cardInputSchema.parse({ ...valid, name: '  루키  ' }).name).toBe('루키')
  })

  it('이미지 없이도 등록할 수 있다(나중에 업로드)', () => {
    const { imageUrl: _omitted, ...withoutImage } = valid
    expect(cardInputSchema.parse(withoutImage).imageUrl).toBeNull()
    expect(cardInputSchema.parse({ ...valid, imageUrl: null }).imageUrl).toBeNull()
  })

  it('Storage 경로 형태도 허용한다(형식은 4단계에서 확정)', () => {
    expect(cardInputSchema.safeParse({ ...valid, imageUrl: 'cards/e01.png' }).success).toBe(true)
  })

  it('빈 이름·잘못된 등급·빈 이미지 경로·가중치 0을 거부한다', () => {
    expect(cardInputSchema.safeParse({ ...valid, name: '   ' }).success).toBe(false)
    expect(cardInputSchema.safeParse({ ...valid, grade: 'ultra' }).success).toBe(false)
    expect(cardInputSchema.safeParse({ ...valid, imageUrl: '   ' }).success).toBe(false)
    expect(cardInputSchema.safeParse({ ...valid, drawWeight: 0 }).success).toBe(false)
  })
})

describe('dexNoSchema', () => {
  it('N01 형식만 통과', () => {
    expect(dexNoSchema.safeParse('N01').success).toBe(true)
    expect(dexNoSchema.safeParse('M12').success).toBe(true)
    expect(dexNoSchema.safeParse('N1').success).toBe(false)
    expect(dexNoSchema.safeParse('X01').success).toBe(false)
  })
})

describe('drawRequestSchema', () => {
  it('1장 또는 10연차만 허용', () => {
    expect(drawRequestSchema.safeParse({ drawType: 'normal', count: 1 }).success).toBe(true)
    expect(drawRequestSchema.safeParse({ drawType: 'premium', count: 10 }).success).toBe(true)
    expect(drawRequestSchema.safeParse({ drawType: 'normal', count: 3 }).success).toBe(false)
  })
})

describe('predictionInputSchema', () => {
  const base = { gameId: GAME_ID, pickWinner: 'home' as const }

  it('승패만 있어도 유효하다(스코어는 선택)', () => {
    const parsed = predictionInputSchema.parse(base)
    expect(parsed.pickHomeScore).toBeNull()
    expect(parsed.pickAwayScore).toBeNull()
  })

  it('스코어 둘 다 있으면 유효하다', () => {
    expect(
      predictionInputSchema.safeParse({ ...base, pickHomeScore: 5, pickAwayScore: 3 }).success,
    ).toBe(true)
  })

  it('스코어 한쪽만 있으면 거부한다', () => {
    expect(predictionInputSchema.safeParse({ ...base, pickHomeScore: 5 }).success).toBe(false)
    expect(predictionInputSchema.safeParse({ ...base, pickAwayScore: 3 }).success).toBe(false)
  })

  it('gameId가 uuid가 아니면 거부한다', () => {
    expect(predictionInputSchema.safeParse({ ...base, gameId: 'abc' }).success).toBe(false)
  })
})

describe('gameSettleSchema', () => {
  const base = { gameId: 'game-20260825-1' }

  it('정상 스코어를 통과시킨다', () => {
    expect(gameSettleSchema.safeParse({ ...base, homeScore: 5, awayScore: 3 }).success).toBe(true)
  })

  it('무승부(동점)를 허용한다 — KBO는 무승부가 있다', () => {
    expect(gameSettleSchema.safeParse({ ...base, homeScore: 3, awayScore: 3 }).success).toBe(true)
  })

  it('0점도 허용한다(완봉)', () => {
    expect(gameSettleSchema.safeParse({ ...base, homeScore: 0, awayScore: 4 }).success).toBe(true)
  })

  it('음수·소수·범위 초과를 거부한다', () => {
    expect(gameSettleSchema.safeParse({ ...base, homeScore: -1, awayScore: 3 }).success).toBe(false)
    expect(gameSettleSchema.safeParse({ ...base, homeScore: 1.5, awayScore: 3 }).success).toBe(
      false,
    )
    expect(gameSettleSchema.safeParse({ ...base, homeScore: 100, awayScore: 3 }).success).toBe(
      false,
    )
  })

  it('스코어가 빠지면 거부한다', () => {
    expect(gameSettleSchema.safeParse({ ...base, homeScore: 5 }).success).toBe(false)
  })
})

describe('teamUpdateSchema', () => {
  const valid = { id: 1, name: 'KIA 타이거즈', shortName: 'KIA', color: '#EA0029' }

  it('로고 없이도 저장할 수 있다(미등록 시 팀 컬러로 대체)', () => {
    expect(teamUpdateSchema.parse(valid).logoUrl).toBeNull()
  })

  it('#RRGGBB 만 허용하고 축약형 #RGB 는 거부한다', () => {
    expect(teamUpdateSchema.safeParse({ ...valid, color: '#EA0029' }).success).toBe(true)
    expect(teamUpdateSchema.safeParse({ ...valid, color: '#ea0029' }).success).toBe(true)
    expect(teamUpdateSchema.safeParse({ ...valid, color: '#E02' }).success).toBe(false)
    expect(teamUpdateSchema.safeParse({ ...valid, color: 'EA0029' }).success).toBe(false)
    expect(teamUpdateSchema.safeParse({ ...valid, color: 'red' }).success).toBe(false)
  })

  it('빈 팀명·빈 약칭·너무 긴 약칭을 거부한다', () => {
    expect(teamUpdateSchema.safeParse({ ...valid, name: '  ' }).success).toBe(false)
    expect(teamUpdateSchema.safeParse({ ...valid, shortName: '' }).success).toBe(false)
    expect(teamUpdateSchema.safeParse({ ...valid, shortName: '일곱글자약칭' }).success).toBe(true)
    expect(teamUpdateSchema.safeParse({ ...valid, shortName: '일곱글자가넘음' }).success).toBe(
      false,
    )
  })

  it('id 가 양의 정수가 아니면 거부한다', () => {
    expect(teamUpdateSchema.safeParse({ ...valid, id: 0 }).success).toBe(false)
    expect(teamUpdateSchema.safeParse({ ...valid, id: -1 }).success).toBe(false)
  })
})

describe('pointAdjustSchema', () => {
  it('0 조정과 빈 사유를 거부한다', () => {
    expect(pointAdjustSchema.safeParse({ userId: USER_ID, amount: 0, memo: '보상' }).success).toBe(
      false,
    )
    expect(pointAdjustSchema.safeParse({ userId: USER_ID, amount: 100, memo: ' ' }).success).toBe(
      false,
    )
  })

  it('사유가 있는 +/- 조정은 통과한다', () => {
    expect(
      pointAdjustSchema.safeParse({ userId: USER_ID, amount: -50, memo: '오지급 회수' }).success,
    ).toBe(true)
  })
})
