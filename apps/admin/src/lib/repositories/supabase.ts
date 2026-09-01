import type {
  Card,
  CardFilter,
  CardGrade,
  CardSpreadRow,
  DashboardSummary,
  DrawStats,
  Game,
  GameFilter,
  GameWithStats,
  PointFlowPoint,
  PointTransaction,
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
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { todayInKst } from '@/lib/format'
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
import { toCard, toGame, toPrediction, toTeam } from './mappers'

/**
 * Supabase 구현.
 *
 * 클라이언트 선택 기준:
 * - 기본은 **쿠키 클라이언트**(`createClient`). authenticated 역할로 붙어 RLS 가 그대로 적용된다.
 *   운영자 정책(`is_admin()`)을 통과해야 하므로, 서버 액션에 버그가 있어도 DB 가 한 번 더 막아준다.
 * - **service role**(`createAdminClient`)은 RLS/컬럼 권한으로 막힌 작업에만 쓴다:
 *   포인트 조정(`users.points` 는 컬럼 grant 에서 제외됨), 정산 RPC.
 *
 * 도감번호 부여는 트랜잭션 대신 **unique 제약 + 재시도**로 처리한다(통합기획서 5장 방침).
 */

/**
 * 조인 결과를 단일 객체로 정규화한다.
 *
 * PostgREST 는 뷰에도 하위 테이블의 FK 관계를 물려주기 때문에,
 * `user_cards.card_id` 가 `cards` 와 `card_spreads` 양쪽으로 이어져 관계가 모호해진다.
 * 그러면 supabase-js 가 to-one 조인을 배열로 추론한다. 뷰를 추가할 때마다 재발하므로
 * 여기서 흡수한다(`!inner` 를 썼으므로 실제로는 항상 1건이다).
 */
const one = <T>(value: T | readonly T[]): T => {
  const single = Array.isArray(value) ? (value as readonly T[])[0] : (value as T)
  if (single === undefined) throw new Error('조인 결과가 비어 있습니다')
  return single
}

const RANGE_ERROR = 'PGRST103' // 요청 범위가 결과 범위를 벗어남 — 빈 페이지로 처리한다

const emptyPage = <T>({ page, pageSize }: PageRequest): Paged<T> => ({
  items: [],
  total: 0,
  page,
  pageSize,
})

const rangeOf = ({ page, pageSize }: PageRequest): [number, number] => {
  const from = (page - 1) * pageSize
  return [from, from + pageSize - 1]
}

/** 도감번호순 = 등급 순서(N→M) → 순번. DB 정렬로는 표현할 수 없어 조회 후 정렬한다. */
const byDexNo = (a: Card, b: Card): number => {
  const pa = parseDexNo(a.dexNo)
  const pb = parseDexNo(b.dexNo)
  if (pa === null || pb === null) return a.dexNo.localeCompare(b.dexNo)

  const diff = gradeRank(pa.grade) - gradeRank(pb.grade)
  return diff !== 0 ? diff : pa.seq - pb.seq
}

const cardRepository: CardRepository = {
  list: async (filter: CardFilter, page) => {
    const supabase = await createClient()
    const [from, to] = rangeOf(page)

    let query = supabase.from('cards').select('*', { count: 'exact' })

    if (!filter.includeDeleted) query = query.is('deleted_at', null)
    if (filter.grade !== null) query = query.eq('grade', filter.grade)
    if (filter.type !== null) query = query.eq('type', filter.type)
    if (filter.isSeason !== null) query = query.eq('is_season', filter.isSeason)

    const keyword = filter.keyword.trim()
    if (keyword !== '') {
      // 이름 또는 도감번호 부분 일치
      query = query.or(`name.ilike.%${keyword}%,dex_no.ilike.%${keyword}%`)
    }

    // 등급 → 도감번호 순으로 DB 에서 1차 정렬하고, 등급 순서만 코드에서 바로잡는다
    const { data, error, count } = await query.order('grade').order('dex_no').range(from, to)

    if (error !== null) {
      if (error.code === RANGE_ERROR) return emptyPage(page)
      throw new Error(`카드 목록 조회 실패: ${error.message}`)
    }

    return {
      items: data.map(toCard).toSorted(byDexNo),
      total: count ?? 0,
      page: page.page,
      pageSize: page.pageSize,
    }
  },

  findById: async (id) => {
    const supabase = await createClient()
    const { data, error } = await supabase.from('cards').select('*').eq('id', id).maybeSingle()

    if (error !== null) throw new Error(`카드 조회 실패: ${error.message}`)
    return data === null ? null : toCard(data)
  },

  countByGrade: async (grade) => {
    const supabase = await createClient()
    const { count, error } = await supabase
      .from('cards')
      .select('id', { count: 'exact', head: true })
      .eq('grade', grade)

    if (error !== null) throw new Error(`등급별 카드 수 조회 실패: ${error.message}`)
    return count ?? 0
  },

  /**
   * 도감번호는 "해당 등급 개수 + 1". 동시 등록 시 같은 번호가 나올 수 있으므로
   * unique 제약 위반(23505)을 만나면 다시 센다.
   */
  create: async (input) => {
    const supabase = await createClient()

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const seq = (await cardRepository.countByGrade(input.grade)) + 1
      const dexNo = formatDexNo({ grade: input.grade, seq: seq + attempt })

      const { data, error } = await supabase
        .from('cards')
        .insert({
          dex_no: dexNo,
          name: input.name,
          grade: input.grade,
          type: input.type,
          image_url: input.imageUrl,
          draw_weight: input.drawWeight,
          is_season: input.isSeason,
        })
        .select('*')
        .single()

      if (error === null) return toCard(data)
      if (error.code !== '23505') throw new Error(`카드 등록 실패: ${error.message}`)
    }

    throw new Error('도감번호 부여에 반복 실패했습니다. 잠시 후 다시 시도하세요')
  },

  update: async (id, input) => {
    const supabase = await createClient()
    const target = await cardRepository.findById(id)
    if (target === null) throw new Error(`카드를 찾을 수 없습니다: ${id}`)

    // 등급이 바뀌면 새 등급의 다음 번호를 부여한다(비워진 번호는 재사용하지 않는다)
    const dexNo =
      target.grade === input.grade
        ? target.dexNo
        : formatDexNo({
            grade: input.grade,
            seq: (await cardRepository.countByGrade(input.grade)) + 1,
          })

    const { data, error } = await supabase
      .from('cards')
      .update({
        dex_no: dexNo,
        name: input.name,
        grade: input.grade,
        type: input.type,
        image_url: input.imageUrl,
        draw_weight: input.drawWeight,
        is_season: input.isSeason,
      })
      .eq('id', id)
      .select('*')
      .single()

    if (error !== null) throw new Error(`카드 수정 실패: ${error.message}`)
    return toCard(data)
  },

  softDelete: async (id) => {
    const supabase = await createClient()
    const { error } = await supabase
      .from('cards')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)

    if (error !== null) throw new Error(`카드 삭제 실패: ${error.message}`)
  },

  restore: async (id) => {
    const supabase = await createClient()
    const { error } = await supabase.from('cards').update({ deleted_at: null }).eq('id', id)

    if (error !== null) throw new Error(`카드 복구 실패: ${error.message}`)
  },
}

const teamRepository: TeamRepository = {
  list: async () => {
    const supabase = await createClient()
    const { data, error } = await supabase.from('teams').select('*').order('id')

    if (error !== null) throw new Error(`구단 목록 조회 실패: ${error.message}`)
    return data.map(toTeam)
  },

  findById: async (id) => {
    const supabase = await createClient()
    const { data, error } = await supabase.from('teams').select('*').eq('id', id).maybeSingle()

    if (error !== null) throw new Error(`구단 조회 실패: ${error.message}`)
    return data === null ? null : toTeam(data)
  },

  update: async (id, patch) => {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('teams')
      .update({
        name: patch.name,
        short_name: patch.shortName,
        color: patch.color,
        logo_url: patch.logoUrl,
      })
      .eq('id', id)
      .select('*')
      .single()

    if (error !== null) throw new Error(`구단 수정 실패: ${error.message}`)
    return toTeam(data)
  },
}

const userRepository: UserRepository = {
  list: async (keyword, page) => {
    const supabase = await createClient()
    const [from, to] = rangeOf(page)

    let query = supabase.from('user_summaries').select('*', { count: 'exact' })

    const trimmed = keyword.trim()
    if (trimmed !== '') query = query.ilike('nickname', `%${trimmed}%`)

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error !== null) {
      if (error.code === RANGE_ERROR) return emptyPage(page)
      throw new Error(`유저 목록 조회 실패: ${error.message}`)
    }

    const items: readonly UserSummary[] = data.map((row) => ({
      id: row.id ?? '',
      nickname: row.nickname ?? '(닉네임 미설정)',
      favoriteTeamId: row.favorite_team_id,
      points: row.points ?? 0,
      ownedCardKinds: row.owned_card_kinds ?? 0,
      createdAt: row.created_at ?? '',
    }))

    return { items, total: count ?? 0, page: page.page, pageSize: page.pageSize }
  },

  findDetail: async (id) => {
    const supabase = await createClient()

    const [profile, owned, draws, transactions, predictions, cardTotals] = await Promise.all([
      supabase.from('user_summaries').select('*').eq('id', id).maybeSingle(),
      supabase
        .from('user_cards')
        .select('card_id, count, acquired_at, cards!inner(dex_no, name, grade, deleted_at)')
        .eq('user_id', id)
        .is('cards.deleted_at', null),
      supabase
        .from('draws')
        .select('*, cards!inner(dex_no, name, grade)')
        .eq('user_id', id)
        .order('created_at', { ascending: false })
        .limit(100),
      supabase
        .from('point_transactions')
        .select('*')
        .eq('user_id', id)
        .order('created_at', { ascending: false })
        .limit(200),
      supabase.from('predictions').select('result').eq('user_id', id),
      supabase.from('cards').select('grade').is('deleted_at', null),
    ])

    if (profile.error !== null) throw new Error(`유저 조회 실패: ${profile.error.message}`)
    if (profile.data === null) return null
    for (const result of [owned, draws, transactions, predictions, cardTotals]) {
      if (result.error !== null) throw new Error(`유저 상세 조회 실패: ${result.error.message}`)
    }

    const ownedCards = (owned.data ?? []).map((row) => {
      const card = one(row.cards)
      return {
        cardId: row.card_id,
        dexNo: card.dex_no,
        name: card.name,
        grade: card.grade,
        count: row.count,
        acquiredAt: row.acquired_at,
      }
    })

    const totalsByGrade = new Map<CardGrade, number>()
    ;(cardTotals.data ?? []).forEach((row) => {
      totalsByGrade.set(row.grade, (totalsByGrade.get(row.grade) ?? 0) + 1)
    })

    const results = predictions.data ?? []
    const detail: UserDetail = {
      id: profile.data.id ?? id,
      nickname: profile.data.nickname ?? '(닉네임 미설정)',
      favoriteTeamId: profile.data.favorite_team_id,
      points: profile.data.points ?? 0,
      ownedCardKinds: profile.data.owned_card_kinds ?? 0,
      createdAt: profile.data.created_at ?? '',
      dexProgress: CARD_GRADES.map((grade) => ({
        grade,
        owned: ownedCards.filter((card) => card.grade === grade).length,
        total: totalsByGrade.get(grade) ?? 0,
      })),
      ownedCards,
      draws: (draws.data ?? []).map((row) => {
        const card = one(row.cards)
        return {
          id: row.id,
          drawType: row.draw_type,
          cardId: row.card_id,
          cardDexNo: card.dex_no,
          cardName: card.name,
          cardGrade: card.grade,
          cost: row.cost,
          isDuplicate: row.is_duplicate,
          refundPoints: row.refund_points,
          createdAt: row.created_at,
        }
      }),
      pointTransactions: (transactions.data ?? []).map((row) => ({
        id: row.id,
        amount: row.amount,
        reason: row.reason,
        refId: row.ref_id,
        memo: row.memo,
        createdAt: row.created_at,
      })),
      record: {
        totalPredictions: results.length,
        winHits: results.filter((row) => row.result === 'win_hit').length,
        scoreHits: results.filter((row) => row.result === 'score_hit').length,
        // 연승은 경기 순서가 필요해 별도 계산이 든다. 4단계 범위 밖으로 두고 0 으로 표시한다.
        bestStreak: 0,
      },
    }

    return detail
  },

  /**
   * 포인트 조정은 service role 로만 가능하다.
   * `users.points` 는 컬럼 grant 에서 제외돼 있어 authenticated 로는 수정할 수 없다(의도된 설계).
   */
  adjustPoints: async (id, amount, memo) => {
    const supabase = createAdminClient()

    const { data: user, error: readError } = await supabase
      .from('users')
      .select('points')
      .eq('id', id)
      .maybeSingle()

    if (readError !== null) throw new Error(`유저 조회 실패: ${readError.message}`)
    if (user === null) throw new Error(`유저를 찾을 수 없습니다: ${id}`)
    if (user.points + amount < 0) {
      throw new Error(`차감 후 포인트가 음수가 됩니다 (현재 ${String(user.points)}p)`)
    }

    const { data: transaction, error: insertError } = await supabase
      .from('point_transactions')
      .insert({ user_id: id, amount, reason: 'admin_adjust', memo })
      .select('*')
      .single()

    if (insertError !== null) throw new Error(`포인트 내역 기록 실패: ${insertError.message}`)

    const { error: updateError } = await supabase
      .from('users')
      .update({ points: user.points + amount })
      .eq('id', id)

    if (updateError !== null) throw new Error(`포인트 반영 실패: ${updateError.message}`)

    const result: PointTransaction = {
      id: transaction.id,
      amount: transaction.amount,
      reason: transaction.reason,
      refId: transaction.ref_id,
      memo: transaction.memo,
      createdAt: transaction.created_at,
    }

    return result
  },
}

const gameRepository: GameRepository = {
  list: async (filter: GameFilter, page) => {
    const supabase = await createClient()
    const [from, to] = rangeOf(page)

    let query = supabase.from('games_with_stats').select('*', { count: 'exact' })

    if (filter.date !== null) query = query.eq('game_date', filter.date)
    if (filter.status !== null) query = query.eq('status', filter.status)

    const { data, error, count } = await query
      .order('game_date', { ascending: false })
      .order('start_at')
      .range(from, to)

    if (error !== null) {
      if (error.code === RANGE_ERROR) return emptyPage(page)
      throw new Error(`경기 목록 조회 실패: ${error.message}`)
    }

    const items: readonly GameWithStats[] = data.map((row) => ({
      id: row.id ?? '',
      gameDate: row.game_date ?? '',
      startAt: row.start_at ?? '',
      predictCloseAt: row.predict_close_at ?? '',
      homeTeamId: row.home_team_id ?? 0,
      awayTeamId: row.away_team_id ?? 0,
      status: row.status ?? 'scheduled',
      homeScore: row.home_score,
      awayScore: row.away_score,
      settledAt: row.settled_at,
      predictionCount: row.prediction_count ?? 0,
      homePickCount: row.home_pick_count ?? 0,
    }))

    return { items, total: count ?? 0, page: page.page, pageSize: page.pageSize }
  },

  findById: async (id) => {
    const supabase = await createClient()
    const { data, error } = await supabase.from('games').select('*').eq('id', id).maybeSingle()

    if (error !== null) throw new Error(`경기 조회 실패: ${error.message}`)
    return data === null ? null : toGame(data)
  },

  predictionsOf: async (gameId) => {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('predictions')
      .select('*, users(nickname)')
      .eq('game_id', gameId)
      .order('created_at')

    if (error !== null) throw new Error(`예측 로그 조회 실패: ${error.message}`)
    return data.map(toPrediction)
  },

  /** 정산은 여러 테이블을 한 트랜잭션으로 묶어야 하므로 RPC 를 쓴다(service role 전용) */
  settle: async (id, homeScore, awayScore) => {
    const supabase = createAdminClient()
    const { error } = await supabase.rpc('settle_game', {
      target_game_id: id,
      final_home_score: homeScore,
      final_away_score: awayScore,
    })

    if (error !== null) throw new Error(error.message)

    const settled = await gameRepository.findById(id)
    if (settled === null) throw new Error('정산 후 경기를 다시 조회하지 못했습니다')

    return settled satisfies Game
  },
}

const statsRepository: StatsRepository = {
  dashboard: async () => {
    const supabase = await createClient()
    const today = todayInKst()

    const [cardsByGradeRows, totalUsers, todayGames, todayDraws, todayTransactions] =
      await Promise.all([
        supabase.from('cards').select('grade').is('deleted_at', null),
        supabase.from('users').select('id', { count: 'exact', head: true }),
        supabase.from('games').select('status').eq('game_date', today),
        supabase.from('draws').select('user_id').gte('created_at', `${today}T00:00:00+09:00`),
        supabase
          .from('point_transactions')
          .select('amount')
          .gte('created_at', `${today}T00:00:00+09:00`),
      ])

    for (const result of [cardsByGradeRows, todayGames, todayDraws, todayTransactions]) {
      if (result.error !== null) throw new Error(`대시보드 조회 실패: ${result.error.message}`)
    }

    const grades = cardsByGradeRows.data ?? []
    const games = todayGames.data ?? []
    const draws = todayDraws.data ?? []
    const transactions = todayTransactions.data ?? []

    const summary: DashboardSummary = {
      totalUsers: totalUsers.count ?? 0,
      activeUsersToday: new Set(draws.map((row) => row.user_id)).size,
      totalCards: grades.length,
      cardsByGrade: CARD_GRADES.map((grade) => ({
        grade,
        count: grades.filter((row) => row.grade === grade).length,
      })),
      drawsToday: draws.length,
      gamesToday: games.length,
      gamesSettledToday: games.filter((row) => row.status === 'settled').length,
      pointsIssuedToday: transactions
        .filter((row) => row.amount > 0)
        .reduce((sum, row) => sum + row.amount, 0),
      pointsSpentToday: transactions
        .filter((row) => row.amount < 0)
        .reduce((sum, row) => sum - row.amount, 0),
    }

    return summary
  },

  drawStats: async () => {
    const supabase = await createClient()
    const { data, error } = await supabase.from('draw_grade_stats').select('*')

    if (error !== null) throw new Error(`뽑기 통계 조회 실패: ${error.message}`)

    const rows = data ?? []
    const stats: readonly DrawStats[] = DRAW_TYPES.map((drawType) => {
      const scoped = rows.filter((row) => row.draw_type === drawType)
      const total = scoped.reduce((sum, row) => sum + (row.draw_count ?? 0), 0)

      return {
        drawType,
        rates: CARD_GRADES.map((grade) => {
          const drawCount = scoped.find((row) => row.grade === grade)?.draw_count ?? 0

          return {
            grade,
            expectedRate: DRAW_GRADE_RATES[drawType][grade],
            actualRate: total === 0 ? 0 : (drawCount / total) * 100,
            drawCount,
          }
        }),
      }
    })

    return stats
  },

  cardSpread: async () => {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('card_spreads')
      .select('*')
      .order('issued_count', { ascending: false })

    if (error !== null) throw new Error(`카드 보유 현황 조회 실패: ${error.message}`)

    const rows: readonly CardSpreadRow[] = (data ?? []).map((row) => ({
      cardId: row.card_id ?? '',
      dexNo: row.dex_no ?? '',
      name: row.name ?? '',
      grade: row.grade ?? 'normal',
      ownerCount: row.owner_count ?? 0,
      issuedCount: row.issued_count ?? 0,
    }))

    return rows
  },

  pointFlow: async (days) => {
    const supabase = await createClient()
    const today = todayInKst()
    const since = new Date(Date.parse(`${today}T00:00:00+09:00`) - (days - 1) * 86400000)
      .toISOString()
      .slice(0, 10)

    const { data, error } = await supabase
      .from('point_flow_daily')
      .select('*')
      .gte('flow_date', since)
      .order('flow_date')

    if (error !== null) throw new Error(`포인트 추이 조회 실패: ${error.message}`)

    const byDate = new Map((data ?? []).map((row) => [row.flow_date ?? '', row]))

    // 데이터가 없는 날도 0 으로 채워 차트가 끊기지 않게 한다
    const flow: readonly PointFlowPoint[] = Array.from({ length: days }, (_, index) => {
      const date = new Date(Date.parse(`${since}T00:00:00+09:00`) + index * 86400000)
        .toISOString()
        .slice(0, 10)
      const row = byDate.get(date)

      return { date, issued: row?.issued ?? 0, spent: row?.spent ?? 0 }
    })

    return flow
  },
}

export const supabaseRepositories: AdminRepositories = {
  cards: cardRepository,
  teams: teamRepository,
  users: userRepository,
  games: gameRepository,
  stats: statsRepository,
}

/** 화면에서 쓰지 않지만 타입 참조를 위해 남긴다 */
export type { Team }
