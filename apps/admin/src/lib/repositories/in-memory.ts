import type {
  Card,
  CardFilter,
  CardGrade,
  CardSpreadRow,
  CrawlRun,
  DashboardSummary,
  DrawStats,
  Game,
  GameFilter,
  GameWithStats,
  PointFlowPoint,
  PointTransaction,
  Prediction,
  Team,
  UserDetail,
  UserSummary,
} from '@kbokkang/shared'
import {
  CARD_GRADES,
  DRAW_GRADE_RATES,
  DRAW_TYPES,
  formatDexNo,
  gradeRank,
  parseDexNo,
} from '@kbokkang/shared'
import type {
  AdminRepositories,
  CardRepository,
  GameRepository,
  Paged,
  PageRequest,
  StatsRepository,
  TeamRepository,
  UserRepository,
} from './types'
import { CARD_FIXTURES } from './fixtures/cards'
import { TEAM_FIXTURES } from './fixtures/teams'
import { USER_FIXTURES } from './fixtures/users'
import { GAME_FIXTURES, predictionFixtures } from './fixtures/games'

/**
 * fixture 기반 in-memory 구현. 화면 개발용이며 스키마 확정 후 Supabase 구현으로 교체한다.
 * 상태는 모듈 스코프에 두되 배열을 변형하지 않고 새 배열로 교체한다(불변성 유지).
 */

let cards: readonly Card[] = CARD_FIXTURES
let teams: readonly Team[] = TEAM_FIXTURES
let users: readonly UserDetail[] = USER_FIXTURES
let games: readonly GameWithStats[] = GAME_FIXTURES

/** 도감번호순 정렬: 등급 순서(N→M) 후 순번 */
const byDexNo = (a: Card, b: Card): number => {
  const parsedA = parseDexNo(a.dexNo)
  const parsedB = parseDexNo(b.dexNo)
  if (parsedA === null || parsedB === null) return a.dexNo.localeCompare(b.dexNo)

  const gradeDiff = gradeRank(parsedA.grade) - gradeRank(parsedB.grade)
  return gradeDiff !== 0 ? gradeDiff : parsedA.seq - parsedB.seq
}

const paginate = <T>(items: readonly T[], { page, pageSize }: PageRequest): Paged<T> => {
  const start = (page - 1) * pageSize

  return {
    items: items.slice(start, start + pageSize),
    total: items.length,
    page,
    pageSize,
  }
}

const matchesCardFilter = (card: Card, filter: CardFilter): boolean => {
  if (!filter.includeDeleted && card.deletedAt !== null) return false
  if (filter.grade !== null && card.grade !== filter.grade) return false
  if (filter.type !== null && card.type !== filter.type) return false
  if (filter.isSeason !== null && card.isSeason !== filter.isSeason) return false

  const keyword = filter.keyword.trim().toLowerCase()
  if (keyword === '') return true

  return card.name.toLowerCase().includes(keyword) || card.dexNo.toLowerCase().includes(keyword)
}

const cardRepository: CardRepository = {
  list: (filter, page) =>
    Promise.resolve(
      paginate(cards.filter((card) => matchesCardFilter(card, filter)).toSorted(byDexNo), page),
    ),

  findById: (id) => Promise.resolve(cards.find((card) => card.id === id) ?? null),

  countByGrade: (grade) => Promise.resolve(cards.filter((card) => card.grade === grade).length),

  create: async (input) => {
    const seq = (await cardRepository.countByGrade(input.grade)) + 1
    const dexNo = formatDexNo({ grade: input.grade, seq })

    const created: Card = {
      id: `card-${dexNo.toLowerCase()}-${cards.length + 1}`,
      dexNo,
      name: input.name,
      grade: input.grade,
      type: input.type,
      imageUrl: input.imageUrl,
      drawWeight: input.drawWeight,
      isSeason: input.isSeason,
      createdAt: new Date().toISOString(),
      deletedAt: null,
    }

    cards = [...cards, created]
    return created
  },

  createMany: async (inputs) => {
    const created = []
    for (const input of inputs) {
      created.push(await cardRepository.create(input))
    }
    return created
  },

  update: async (id, input) => {
    const target = await cardRepository.findById(id)
    if (target === null) throw new Error(`카드를 찾을 수 없습니다: ${id}`)

    // 등급이 바뀌면 도감번호를 새로 부여한다(어드민 기획서 3.3 초안 정책)
    const dexNo =
      target.grade === input.grade
        ? target.dexNo
        : formatDexNo({
            grade: input.grade,
            seq: (await cardRepository.countByGrade(input.grade)) + 1,
          })

    const updated: Card = { ...target, ...input, dexNo }
    cards = cards.map((card) => (card.id === id ? updated : card))
    return updated
  },

  softDelete: (id) => {
    const deletedAt = new Date().toISOString()
    cards = cards.map((card) => (card.id === id ? { ...card, deletedAt } : card))
    return Promise.resolve()
  },

  restore: (id) => {
    cards = cards.map((card) => (card.id === id ? { ...card, deletedAt: null } : card))
    return Promise.resolve()
  },
}

const teamRepository: TeamRepository = {
  list: () => Promise.resolve(teams),

  findById: (id) => Promise.resolve(teams.find((team) => team.id === id) ?? null),

  update: (id, patch) => {
    const target = teams.find((team) => team.id === id)
    if (target === undefined) throw new Error(`구단을 찾을 수 없습니다: ${String(id)}`)

    const updated: Team = { ...target, ...patch }
    teams = teams.map((team) => (team.id === id ? updated : team))
    return Promise.resolve(updated)
  },
}

const toSummary = (user: UserDetail): UserSummary => ({
  id: user.id,
  nickname: user.nickname,
  favoriteTeamId: user.favoriteTeamId,
  points: user.points,
  ownedCardKinds: user.ownedCardKinds,
  createdAt: user.createdAt,
})

const userRepository: UserRepository = {
  list: (keyword, page) => {
    const trimmed = keyword.trim().toLowerCase()
    const filtered =
      trimmed === '' ? users : users.filter((user) => user.nickname.toLowerCase().includes(trimmed))

    return Promise.resolve(
      paginate(
        filtered.toSorted((a, b) => b.createdAt.localeCompare(a.createdAt)).map(toSummary),
        page,
      ),
    )
  },

  findDetail: (id) => Promise.resolve(users.find((user) => user.id === id) ?? null),

  adjustPoints: (id, amount, memo) => {
    const target = users.find((user) => user.id === id)
    if (target === undefined) throw new Error(`유저를 찾을 수 없습니다: ${id}`)

    const transaction: PointTransaction = {
      id: `${id}-pt-adjust-${target.pointTransactions.length + 1}`,
      amount,
      reason: 'admin_adjust',
      refId: null,
      memo,
      createdAt: new Date().toISOString(),
    }

    const updated: UserDetail = {
      ...target,
      points: target.points + amount,
      pointTransactions: [transaction, ...target.pointTransactions],
    }

    users = users.map((user) => (user.id === id ? updated : user))
    return Promise.resolve(transaction)
  },
}

const gameRepository: GameRepository = {
  list: (filter: GameFilter, page) => {
    const filtered = games.filter((game) => {
      if (filter.date !== null && game.gameDate !== filter.date) return false
      if (filter.status !== null && game.status !== filter.status) return false
      return true
    })

    return Promise.resolve(
      paginate(
        filtered.toSorted(
          (a, b) => b.gameDate.localeCompare(a.gameDate) || a.startAt.localeCompare(b.startAt),
        ),
        page,
      ),
    )
  },

  findById: (id) => Promise.resolve(games.find((game) => game.id === id) ?? null),

  predictionsOf: (gameId) => Promise.resolve<readonly Prediction[]>(predictionFixtures(gameId)),

  settle: (id, homeScore, awayScore) => {
    const target = games.find((game) => game.id === id)
    if (target === undefined) throw new Error(`경기를 찾을 수 없습니다: ${id}`)

    const updated: GameWithStats = {
      ...target,
      homeScore,
      awayScore,
      status: 'settled',
      settledAt: new Date().toISOString(),
    }

    games = games.map((game) => (game.id === id ? updated : game))
    return Promise.resolve<Game>(updated)
  },

  /** fixture 에서는 그날 경기가 있으면 크롤러가 정상 실행된 것으로 본다 */
  latestRun: (date) => {
    const dayGames = games.filter((game) => game.gameDate === date)
    if (dayGames.length === 0) return Promise.resolve(null)

    return Promise.resolve<CrawlRun>({
      id: `run-${date}`,
      targetDate: date,
      runAt: `${date}T12:00:00.000Z`,
      success: true,
      gamesFound: dayGames.length,
      gamesSettled: dayGames.filter((game) => game.status === 'settled').length,
      error: null,
    })
  },
}

const statsRepository: StatsRepository = {
  dashboard: () => {
    const activeCards = cards.filter((card) => card.deletedAt === null)
    const allDraws = users.flatMap((user) => user.draws)
    const todayDraws = allDraws.filter((draw) => draw.createdAt.startsWith('2026-08-25'))
    const todayGames = games.filter((game) => game.gameDate === '2026-08-25')
    const allTransactions = users.flatMap((user) => user.pointTransactions)
    const todayTransactions = allTransactions.filter((item) =>
      item.createdAt.startsWith('2026-08-25'),
    )

    const summary: DashboardSummary = {
      totalUsers: users.length,
      activeUsersToday: users.filter((user) =>
        user.draws.some((draw) => draw.createdAt.startsWith('2026-08-25')),
      ).length,
      totalCards: activeCards.length,
      cardsByGrade: CARD_GRADES.map((grade) => ({
        grade,
        count: activeCards.filter((card) => card.grade === grade).length,
      })),
      drawsToday: todayDraws.length,
      gamesToday: todayGames.length,
      gamesSettledToday: todayGames.filter((game) => game.status === 'settled').length,
      pointsIssuedToday: todayTransactions
        .filter((item) => item.amount > 0)
        .reduce((sum, item) => sum + item.amount, 0),
      pointsSpentToday: todayTransactions
        .filter((item) => item.amount < 0)
        .reduce((sum, item) => sum - item.amount, 0),
    }

    return Promise.resolve(summary)
  },

  drawStats: () => {
    const allDraws = users.flatMap((user) => user.draws)

    const stats: readonly DrawStats[] = DRAW_TYPES.map((drawType) => {
      const scoped = allDraws.filter((draw) => draw.drawType === drawType)

      return {
        drawType,
        rates: CARD_GRADES.map((grade) => {
          const drawCount = scoped.filter((draw) => draw.cardGrade === grade).length

          return {
            grade,
            expectedRate: DRAW_GRADE_RATES[drawType][grade],
            actualRate: scoped.length === 0 ? 0 : (drawCount / scoped.length) * 100,
            drawCount,
          }
        }),
      }
    })

    return Promise.resolve(stats)
  },

  cardSpread: () => {
    const owned = users.flatMap((user) => user.ownedCards)

    const rows: readonly CardSpreadRow[] = cards
      .filter((card) => card.deletedAt === null)
      .map((card) => {
        const matched = owned.filter((item) => item.cardId === card.id)

        return {
          cardId: card.id,
          dexNo: card.dexNo,
          name: card.name,
          grade: card.grade,
          ownerCount: matched.length,
          issuedCount: matched.reduce((sum, item) => sum + item.count, 0),
        }
      })
      .toSorted((a, b) => b.issuedCount - a.issuedCount)

    return Promise.resolve(rows)
  },

  pointFlow: (days) => {
    const allTransactions = users.flatMap((user) => user.pointTransactions)

    const flow: readonly PointFlowPoint[] = Array.from({ length: days }, (_, index) => {
      const day = new Date(Date.parse('2026-08-25T00:00:00.000Z') - (days - 1 - index) * 86400000)
      const date = day.toISOString().slice(0, 10)
      const scoped = allTransactions.filter((item) => item.createdAt.startsWith(date))

      return {
        date,
        issued: scoped
          .filter((item) => item.amount > 0)
          .reduce((sum, item) => sum + item.amount, 0),
        spent: scoped.filter((item) => item.amount < 0).reduce((sum, item) => sum - item.amount, 0),
      }
    })

    return Promise.resolve(flow)
  },
}

export const inMemoryRepositories: AdminRepositories = {
  cards: cardRepository,
  teams: teamRepository,
  users: userRepository,
  games: gameRepository,
  stats: statsRepository,
}

/** 등급별 전체 카드 수 — 도감 진행률 분모 계산에 사용 */
export const cardTotalByGrade = (grade: CardGrade): number =>
  cards.filter((card) => card.deletedAt === null && card.grade === grade).length
