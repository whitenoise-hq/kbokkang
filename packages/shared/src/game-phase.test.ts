import { describe, expect, it } from 'vitest'
import { canPredict, gamePhaseOf, hasResult, type GamePhaseInput } from './game-phase'

const NOW = new Date('2026-09-07T09:00:00Z')
const LATER = '2026-09-07T10:00:00Z'
const EARLIER = '2026-09-07T08:00:00Z'

const game = (over: Partial<GamePhaseInput>): GamePhaseInput => ({
  status: 'scheduled',
  cancelled: false,
  predictCloseAt: LATER,
  ...over,
})

describe('gamePhaseOf', () => {
  it('마감 전이면 open — 예측 가능', () => {
    expect(gamePhaseOf(game({}), NOW)).toBe('open')
  })

  it('마감 시각을 지나면 closed — status 가 아직 scheduled 여도', () => {
    // 크롤러가 status 를 늦게 갱신할 수 있다. 시각이 우선이어야 마감 후 예측을 막는다.
    expect(gamePhaseOf(game({ status: 'scheduled', predictCloseAt: EARLIER }), NOW)).toBe('closed')
  })

  it('취소가 최우선이다 — status 가 settled 여도 cancelled 로 본다', () => {
    // 크롤러는 취소 경기를 status='settled' 로 넣는다. 순서를 바꾸면 "정산 완료"로 보인다.
    expect(gamePhaseOf(game({ status: 'settled', cancelled: true }), NOW)).toBe('cancelled')
  })

  it('진행 중·집계 중·정산 완료를 각각 구분한다', () => {
    expect(gamePhaseOf(game({ status: 'live' }), NOW)).toBe('live')
    expect(gamePhaseOf(game({ status: 'aggregating' }), NOW)).toBe('aggregating')
    expect(gamePhaseOf(game({ status: 'settled' }), NOW)).toBe('settled')
  })

  it('status=closed 는 시각과 무관하게 closed 로 떨어진다', () => {
    expect(gamePhaseOf(game({ status: 'closed', predictCloseAt: LATER }), NOW)).toBe('open')
    expect(gamePhaseOf(game({ status: 'closed', predictCloseAt: EARLIER }), NOW)).toBe('closed')
  })
})

describe('canPredict', () => {
  it('open 에서만 예측할 수 있다', () => {
    expect(canPredict('open')).toBe(true)
    for (const phase of ['cancelled', 'closed', 'live', 'aggregating', 'settled'] as const) {
      expect(canPredict(phase)).toBe(false)
    }
  })
})

describe('hasResult', () => {
  it('정산 완료에만 결과가 있다 — 집계 중에는 스코어를 보여주지 않는다', () => {
    expect(hasResult('settled')).toBe(true)
    expect(hasResult('aggregating')).toBe(false)
    expect(hasResult('cancelled')).toBe(false)
  })
})
