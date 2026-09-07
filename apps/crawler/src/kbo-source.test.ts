import { describe, expect, it } from 'vitest'
import {
  NAVER_TEAM_CODES,
  hasFinalScore,
  isCancelled,
  isNaverTeamCode,
  isRegularSeasonGame,
  looksLikeRegularGameId,
  toGameStatus,
} from '../../../supabase/functions/_shared/kbo-source.ts'

/** 실제 소스 응답을 본뜬 기본값 */
const base = {
  statusCode: 'BEFORE',
  statusInfo: '경기전',
  cancel: false,
  suspended: false,
  homeScore: null as number | null,
  awayScore: null as number | null,
  closed: false,
}

describe('팀 코드', () => {
  it('10개 구단만 정규시즌으로 인정한다', () => {
    expect(Object.keys(NAVER_TEAM_CODES)).toHaveLength(10)
    expect(isNaverTeamCode('SK')).toBe(true)
    expect(isNaverTeamCode('HT')).toBe(true)
  })

  it('올스타전 팀(EA 드림 / WE 나눔)을 걸러낸다', () => {
    expect(isNaverTeamCode('EA')).toBe(false)
    expect(isNaverTeamCode('WE')).toBe(false)
    expect(isRegularSeasonGame('EA', 'WE')).toBe(false)
    expect(isRegularSeasonGame('HT', 'WE')).toBe(false)
    expect(isRegularSeasonGame('HT', 'SS')).toBe(true)
  })

  it('SK 는 SSG 의 레거시 코드다', () => {
    expect(NAVER_TEAM_CODES.SK).toBe('SSG')
  })
})

describe('경기 ID 패턴', () => {
  it('정규 경기 ID 를 통과시킨다', () => {
    expect(looksLikeRegularGameId('20260825HHSK02026')).toBe(true)
    expect(looksLikeRegularGameId('20260312KTLT02026')).toBe(true)
  })

  it('올스타전 ID(날짜 자리가 9999)를 걸러낸다', () => {
    expect(looksLikeRegularGameId('99990711WEEA02026')).toBe(false)
  })

  it('형식이 어긋나면 걸러낸다', () => {
    expect(looksLikeRegularGameId('20260825HHSK')).toBe(false)
    expect(looksLikeRegularGameId('')).toBe(false)
  })
})

describe('상태 매핑', () => {
  it('경기 전 — 마감 여부로 scheduled/closed 를 나눈다', () => {
    expect(toGameStatus(base)).toBe('scheduled')
    expect(toGameStatus({ ...base, closed: true })).toBe('closed')
  })

  it('이닝 정보가 있으면 진행 중이다(statusCode 에 LIVE 가 없다)', () => {
    expect(toGameStatus({ ...base, statusInfo: '5회초' })).toBe('live')
    expect(toGameStatus({ ...base, statusInfo: '9회말' })).toBe('live')
    expect(toGameStatus({ ...base, statusInfo: '10회말' })).toBe('live')
  })

  it('결과가 나오면 집계중 — 우리 쪽 포인트 지급은 아직 안 됐다', () => {
    expect(toGameStatus({ ...base, statusCode: 'RESULT', statusInfo: '9회말', homeScore: 5, awayScore: 3 })).toBe(
      'aggregating',
    )
  })

  it('취소 경기는 더 처리할 것이 없다', () => {
    expect(toGameStatus({ ...base, cancel: true })).toBe('settled')
    // 취소 경기도 statusCode=BEFORE, 스코어 0:0 으로 온다
    expect(toGameStatus({ ...base, cancel: true, statusInfo: '경기취소', homeScore: 0, awayScore: 0 })).toBe(
      'settled',
    )
  })
})

describe('취소 판정', () => {
  it('cancel 플래그 또는 statusInfo 로 판정한다', () => {
    expect(isCancelled({ cancel: true, statusInfo: '경기전' })).toBe(true)
    expect(isCancelled({ cancel: false, statusInfo: '경기취소' })).toBe(true)
    expect(isCancelled({ cancel: false, statusInfo: '9회말' })).toBe(false)
  })
})

describe('결과 확정 여부', () => {
  it('RESULT + 스코어가 있어야 정산 대상이다', () => {
    expect(hasFinalScore({ ...base, statusCode: 'RESULT', homeScore: 5, awayScore: 3 })).toBe(true)
    expect(hasFinalScore({ ...base, statusCode: 'BEFORE', homeScore: 0, awayScore: 0 })).toBe(false)
  })

  it('취소 경기는 스코어 0:0 이 와도 정산 대상이 아니다', () => {
    expect(
      hasFinalScore({ ...base, statusCode: 'RESULT', cancel: true, homeScore: 0, awayScore: 0 }),
    ).toBe(false)
  })
})
