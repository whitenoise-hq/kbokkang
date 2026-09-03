/**
 * KBO 경기 데이터 소스(네이버 스포츠) 관련 상수·판정 로직.
 *
 * 소스 응답을 다루는 규칙을 여기 모아둔다. 크롤러와 테스트가 같은 규칙을 쓴다.
 * 아래 내용은 2026 시즌 843경기 표본을 실제로 조회해 확인한 것이다.
 */

import type { Database } from './database.types.ts'

/** `games.status` — 생성 타입에서 직접 가져온다. DB enum 과 어긋날 수 없다. */
type GameStatus = Database['public']['Enums']['game_status']

/**
 * 네이버 팀 코드 → 구단 약칭(`teams.short_name`).
 *
 * ⚠️ `SK` 는 SSG 랜더스의 레거시 코드다(SK 와이번스 → SSG 랜더스 개명 후에도 코드는 SK).
 * ⚠️ 이 목록에 없는 코드(`EA` 드림 / `WE` 나눔)는 **올스타전** 팀이다.
 *    올스타전은 `categoryId=kbo` 로 함께 내려오므로 이 화이트리스트로 걸러야 한다.
 */
export const NAVER_TEAM_CODES = {
  HT: 'KIA',
  SS: '삼성',
  LG: 'LG',
  OB: '두산',
  KT: 'KT',
  SK: 'SSG',
  LT: '롯데',
  HH: '한화',
  NC: 'NC',
  WO: '키움',
} as const

export type NaverTeamCode = keyof typeof NAVER_TEAM_CODES

export const isNaverTeamCode = (value: string): value is NaverTeamCode =>
  Object.hasOwn(NAVER_TEAM_CODES, value)

/** 정규시즌 경기인지 — 양 팀이 모두 10개 구단이어야 한다(올스타전 제외) */
export const isRegularSeasonGame = (homeCode: string, awayCode: string): boolean =>
  isNaverTeamCode(homeCode) && isNaverTeamCode(awayCode)

/**
 * 정규 경기 ID 패턴 — `20260825HHSK02026` (날짜8 + 원정2 + 홈2 + 더블헤더1 + 시즌4).
 *
 * 앞 4자리를 `20xx` 로 제한한다. 올스타전은 `99990711WEEA02026` 처럼 연도 자리가 `9999` 라서
 * 숫자 8자리만 검사하면 통과해버린다.
 *
 * 팀 코드 화이트리스트가 1차 방어선이고 이건 보조다. 패턴이 다른 경기 유형이 새로 생기면
 * 조용히 섞이지 않도록 확인한다(포스트시즌은 팀 코드가 정규와 같아 코드로는 못 걸러낸다).
 */
export const GAME_ID_PATTERN = /^20\d{6}[A-Z]{4}\d{5}$/

export const looksLikeRegularGameId = (gameId: string): boolean => GAME_ID_PATTERN.test(gameId)

/**
 * 소스가 주는 경기 상태 원본.
 *
 * `statusCode` 는 `BEFORE` / `RESULT` 두 가지뿐이고 진행 중 상태가 따로 없다.
 * 이닝 정보는 `statusInfo`('9회말' 등)로 오고, 취소는 `cancel` 플래그로만 알 수 있다
 * (취소 경기도 스코어 0:0 · statusCode BEFORE 로 온다).
 */
export interface NaverGameStatusInput {
  readonly statusCode: string
  readonly statusInfo: string
  readonly cancel: boolean
  readonly suspended: boolean
  readonly homeScore: number | null
  readonly awayScore: number | null
  /** 예측 마감 시각을 지났는지 — 서버 시각으로 판정해 넘긴다 */
  readonly closed: boolean
}

/**
 * 소스 상태 → 우리 `games.status`.
 *
 * 우천 취소는 우리 enum 에 없다. 정산 대상이 아니고 예측도 무효여야 하므로
 * `settled`(더 이상 처리할 것 없음)로 두고, 취소 여부는 별도로 표시한다.
 * → 취소 판정은 `isCancelled` 로 따로 노출한다.
 */
export const toGameStatus = (input: NaverGameStatusInput): GameStatus => {
  if (input.cancel) return 'settled'

  if (input.statusCode === 'RESULT') {
    // 결과가 확정됐지만 우리 쪽 정산(포인트 지급)은 아직 안 했을 수 있다
    return 'aggregating'
  }

  // BEFORE 인데 이닝 정보가 있으면 진행 중이다
  if (input.statusInfo !== '' && input.statusInfo !== '경기전' && input.statusInfo !== '경기취소') {
    return 'live'
  }

  return input.closed ? 'closed' : 'scheduled'
}

export const isCancelled = (input: { cancel: boolean; statusInfo: string }): boolean =>
  input.cancel || input.statusInfo === '경기취소'

/**
 * 결과가 확정됐는지 — 정산을 걸 수 있는 상태인가.
 * 취소 경기는 결과가 없으므로 false 다.
 */
export const hasFinalScore = (input: NaverGameStatusInput): boolean =>
  !isCancelled(input) &&
  input.statusCode === 'RESULT' &&
  input.homeScore !== null &&
  input.awayScore !== null

/**
 * 승자 판정.
 *
 * ⚠️ 소스의 `winner` 필드를 쓰지 않는다. 경기 전(BEFORE) 경기가 전부 `DRAW` 로 오기 때문에
 * 그대로 믿으면 미실시 경기를 무승부로 처리한다(표본 225건 중 206건이 경기 전이었다).
 * 스코어로 직접 판정한다.
 */
export type GameOutcome = 'home' | 'away' | 'draw'

export const outcomeOf = (homeScore: number, awayScore: number): GameOutcome => {
  if (homeScore > awayScore) return 'home'
  if (homeScore < awayScore) return 'away'
  return 'draw'
}
