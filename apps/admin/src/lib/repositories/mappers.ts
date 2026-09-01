import type { Card, Game, Prediction, Row, Team } from '@kbokkang/shared'

/**
 * DB 행(snake_case) → 도메인 모델(camelCase) 변환.
 *
 * 화면은 도메인 모델만 본다. DB 컬럼명이 바뀌어도 여기만 고치면 된다.
 * 반대 방향(도메인 → DB)은 쿼리 작성 지점에서 직접 만든다(부분 업데이트가 많아 일괄 변환이 불리하다).
 */

export const toTeam = (row: Row<'teams'>): Team => ({
  id: row.id,
  name: row.name,
  shortName: row.short_name,
  logoUrl: row.logo_url,
  color: row.color,
})

export const toCard = (row: Row<'cards'>): Card => ({
  id: row.id,
  dexNo: row.dex_no,
  name: row.name,
  grade: row.grade,
  type: row.type,
  imageUrl: row.image_url,
  drawWeight: row.draw_weight,
  isSeason: row.is_season,
  createdAt: row.created_at,
  deletedAt: row.deleted_at,
})

export const toGame = (row: Row<'games'>): Game => ({
  id: row.id,
  gameDate: row.game_date,
  startAt: row.start_at,
  predictCloseAt: row.predict_close_at,
  homeTeamId: row.home_team_id,
  awayTeamId: row.away_team_id,
  status: row.status,
  homeScore: row.home_score,
  awayScore: row.away_score,
  settledAt: row.settled_at,
})

/** 예측 로그 — 유저 닉네임을 조인해서 받는다 */
export const toPrediction = (
  row: Row<'predictions'> & { users: { nickname: string | null } | null },
): Prediction => ({
  id: row.id,
  userId: row.user_id,
  userNickname: row.users?.nickname ?? '(닉네임 미설정)',
  gameId: row.game_id,
  pickWinner: row.pick_winner,
  pickHomeScore: row.pick_home_score,
  pickAwayScore: row.pick_away_score,
  result: row.result,
  earnedPoints: row.earned_points,
  createdAt: row.created_at,
})
