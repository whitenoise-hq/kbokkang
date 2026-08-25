import type { GameStatus, GameWithStats, Prediction } from '@kbokkang/shared'
import { PREDICT_CLOSE_OFFSET_MINUTES } from '@kbokkang/shared'
import { USER_FIXTURES } from './users'

/**
 * 경기 fixture. 상태 5종(예정/마감/경기중/집계중/정산완료)을 모두 포함해
 * 경기 관리 화면의 상태 배지와 수동 정산 버튼 활성 조건을 검증한다.
 */

interface GameSeed {
  readonly date: string
  /** KST 기준 경기 시작 시각 (HH:mm) */
  readonly startTime: string
  readonly homeTeamId: number
  readonly awayTeamId: number
  readonly status: GameStatus
  readonly homeScore?: number
  readonly awayScore?: number
}

const SEEDS: readonly GameSeed[] = [
  // 오늘(2026-08-25) — 예정/마감/경기중이 섞인 상태
  { date: '2026-08-25', startTime: '18:30', homeTeamId: 1, awayTeamId: 3, status: 'scheduled' },
  { date: '2026-08-25', startTime: '18:30', homeTeamId: 4, awayTeamId: 6, status: 'scheduled' },
  { date: '2026-08-25', startTime: '17:00', homeTeamId: 2, awayTeamId: 8, status: 'closed' },
  { date: '2026-08-25', startTime: '14:00', homeTeamId: 5, awayTeamId: 10, status: 'live' },
  {
    date: '2026-08-25',
    startTime: '13:00',
    homeTeamId: 7,
    awayTeamId: 9,
    status: 'aggregating',
    homeScore: 5,
    awayScore: 3,
  },
  // 어제 — 정산 완료
  {
    date: '2026-08-24',
    startTime: '18:30',
    homeTeamId: 3,
    awayTeamId: 5,
    status: 'settled',
    homeScore: 7,
    awayScore: 2,
  },
  {
    date: '2026-08-24',
    startTime: '18:30',
    homeTeamId: 6,
    awayTeamId: 1,
    status: 'settled',
    homeScore: 1,
    awayScore: 4,
  },
  {
    date: '2026-08-24',
    startTime: '18:30',
    homeTeamId: 9,
    awayTeamId: 2,
    status: 'settled',
    homeScore: 3,
    awayScore: 3,
  },
  // 크롤링 실패로 결과가 안 들어온 경기 — 수동 정산 대상
  { date: '2026-08-23', startTime: '18:30', homeTeamId: 8, awayTeamId: 4, status: 'aggregating' },
  {
    date: '2026-08-23',
    startTime: '18:30',
    homeTeamId: 10,
    awayTeamId: 7,
    status: 'settled',
    homeScore: 6,
    awayScore: 5,
  },
]

/** KST(UTC+9) 시각을 UTC ISO 문자열로 */
const kstToIso = (date: string, time: string): string => {
  const [hour = '00', minute = '00'] = time.split(':')
  return `${date}T${hour.padStart(2, '0')}:${minute}:00.000+09:00`
}

const minusMinutes = (iso: string, minutes: number): string =>
  new Date(new Date(iso).getTime() - minutes * 60 * 1000).toISOString()

const buildGames = (): readonly GameWithStats[] =>
  SEEDS.map((seed, index) => {
    const startAt = new Date(kstToIso(seed.date, seed.startTime)).toISOString()
    const predictionCount = 3 + ((index * 2) % 7)

    return {
      id: `game-${seed.date.replaceAll('-', '')}-${index + 1}`,
      gameDate: seed.date,
      startAt,
      predictCloseAt: minusMinutes(startAt, PREDICT_CLOSE_OFFSET_MINUTES),
      homeTeamId: seed.homeTeamId,
      awayTeamId: seed.awayTeamId,
      status: seed.status,
      homeScore: seed.homeScore ?? null,
      awayScore: seed.awayScore ?? null,
      settledAt: seed.status === 'settled' ? minusMinutes(startAt, -200) : null,
      predictionCount,
      homePickCount: Math.ceil(predictionCount / 2),
    }
  })

export const GAME_FIXTURES: readonly GameWithStats[] = buildGames()

/** 특정 경기의 예측 로그 — 유저 fixture를 순환 배정 */
export const predictionFixtures = (gameId: string): readonly Prediction[] => {
  const game = GAME_FIXTURES.find((item) => item.id === gameId)
  if (game === undefined) return []

  return USER_FIXTURES.slice(0, game.predictionCount).map((user, index) => {
    const pickWinner = index < game.homePickCount ? 'home' : 'away'
    const hasScorePick = index % 3 === 0
    const settled = game.status === 'settled'

    const homeWon =
      game.homeScore !== null && game.awayScore !== null && game.homeScore > game.awayScore
    const winHit =
      settled && ((pickWinner === 'home' && homeWon) || (pickWinner === 'away' && !homeWon))
    const scoreHit =
      winHit && hasScorePick && index === 0 && game.homeScore !== null && game.awayScore !== null

    const result = settled ? (scoreHit ? 'score_hit' : winHit ? 'win_hit' : 'miss') : 'pending'
    const earnedPoints = settled ? (scoreHit ? 150 : winHit ? 30 : 0) : null

    return {
      id: `${gameId}-pred-${index + 1}`,
      userId: user.id,
      userNickname: user.nickname,
      gameId,
      pickWinner,
      pickHomeScore: hasScorePick ? 3 + (index % 4) : null,
      pickAwayScore: hasScorePick ? 1 + (index % 3) : null,
      result,
      earnedPoints,
      createdAt: minusMinutes(game.predictCloseAt, 30 + index * 7),
    }
  })
}
