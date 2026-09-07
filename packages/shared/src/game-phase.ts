import { remainingUntil } from './countdown'
import type { GameStatus } from './game'

/**
 * 경기의 현재 단계 — 화면이 무엇을 보여줄지 결정하는 단일 판정.
 *
 * `games.status` 만으로는 부족하다. 예측 가능 여부는 **마감 시각과 현재 시각**에 달려 있고,
 * 취소는 status 가 아니라 `cancelled` 플래그다. 화면마다 이 조합을 다시 계산하면
 * "마감됐는데 예측 버튼이 보인다" 같은 사고가 난다.
 *
 * ⚠️ `now` 를 인자로 받는다 — 내부에서 `new Date()` 를 부르지 않는다.
 *    마감 판정은 **서버 시각 기준**이어야 한다(앱기획서 4장).
 */
export type GamePhase =
  /** 우천 등 취소. 예측은 무효 처리됨 */
  | 'cancelled'
  /** 예측 가능 */
  | 'open'
  /** 마감됐지만 아직 시작 전이거나 진행 중 아님 */
  | 'closed'
  /** 경기 진행 중 */
  | 'live'
  /** 종료됐으나 우리 쪽 정산 전 — 유저에게 "집계 중"으로 안내(포인트 미지급 오해 방지) */
  | 'aggregating'
  /** 정산 완료 */
  | 'settled'

export interface GamePhaseInput {
  readonly status: GameStatus
  readonly cancelled: boolean
  /** ISO 문자열 */
  readonly predictCloseAt: string
}

export const gamePhaseOf = (game: GamePhaseInput, now: Date): GamePhase => {
  // 취소가 최우선이다. 취소 경기는 status 가 settled 라서 순서를 바꾸면 "정산 완료"로 보인다.
  if (game.cancelled) return 'cancelled'

  if (game.status === 'settled') return 'settled'
  if (game.status === 'aggregating') return 'aggregating'
  if (game.status === 'live') return 'live'

  // scheduled / closed 는 시각으로 갈린다. status 가 아직 scheduled 여도
  // 마감 시각을 지났으면 예측을 받아서는 안 된다(크롤러가 상태를 늦게 갱신할 수 있다).
  return remainingUntil(new Date(game.predictCloseAt), now) === null ? 'closed' : 'open'
}

/** 예측을 입력·수정할 수 있는 단계인가 */
export const canPredict = (phase: GamePhase): boolean => phase === 'open'

/** 결과(스코어)를 보여줄 단계인가 */
export const hasResult = (phase: GamePhase): boolean => phase === 'settled'
