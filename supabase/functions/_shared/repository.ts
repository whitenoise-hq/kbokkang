import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import {
  hasFinalScore,
  isCancelled,
  looksLikeRegularGameId,
  toGameStatus,
} from './kbo-source.ts'
import type { Database } from './database.types.ts'
import type { SourceGame } from './naver.ts'

/**
 * 크롤러의 DB 접근.
 *
 * service role 로 붙는다 — games upsert, settle_game RPC, crawl_runs 기록이 모두
 * 유저 정책으로 막혀 있는 작업이다. RLS 를 우회하므로 이 코드는 서버에서만 돈다.
 */

export type Client = SupabaseClient<Database>

/**
 * service role 클라이언트.
 *
 * 설정을 **인자로 받는다** — 이 파일은 Node(로컬 CLI)와 Deno(Edge Function) 양쪽에서
 * 쓰이므로 `process.env` 든 `Deno.env` 든 여기서 읽으면 한쪽이 깨진다.
 */
export const createServiceClient = (url: string, serviceRoleKey: string): Client =>
  createClient<Database>(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

/** 구단 약칭 → id. `teams.id` 를 코드에 하드코딩하지 않기 위해 매번 조회한다. */
export const teamIdsByShortName = async (supabase: Client): Promise<Map<string, number>> => {
  const { data, error } = await supabase.from('teams').select('id, short_name')
  if (error !== null) throw new Error(`구단 조회 실패: ${error.message}`)

  return new Map(data.map((row) => [row.short_name, row.id]))
}

export interface UpsertResult {
  readonly upserted: number
  /** 구단 매핑 실패 등으로 건너뛴 경기 */
  readonly skipped: readonly string[]
}

/**
 * 경기 일정/결과 upsert.
 *
 * `external_id` 가 충돌 키다 — 30분마다 같은 경기를 다시 받으므로 이게 없으면 중복이 쌓인다.
 * 스코어와 상태를 함께 갱신하므로 **우천 취소·시작 시각 변경도 이 경로로 반영된다.**
 *
 * 이미 정산(`settled`)된 경기는 건드리지 않는다 — 정산 후 상태를 되돌리면
 * 지급한 포인트와 어긋난다.
 */
export const upsertGames = async (
  supabase: Client,
  games: readonly SourceGame[],
  now: Date,
): Promise<UpsertResult> => {
  if (games.length === 0) return { upserted: 0, skipped: [] }

  const teamIds = await teamIdsByShortName(supabase)
  const skipped: string[] = []

  // 이미 정산된 경기는 덮어쓰지 않는다
  const { data: settledRows, error: settledError } = await supabase
    .from('games')
    .select('external_id')
    .eq('status', 'settled')
    .in(
      'external_id',
      games.map((game) => game.externalId),
    )

  if (settledError !== null) throw new Error(`정산 상태 조회 실패: ${settledError.message}`)
  const alreadySettled = new Set((settledRows ?? []).map((row) => row.external_id))

  const rows = games.flatMap((game) => {
    if (!looksLikeRegularGameId(game.externalId)) {
      skipped.push(`${game.externalId}(ID 패턴 불일치)`)
      return []
    }

    if (alreadySettled.has(game.externalId)) return []

    const homeTeamId = teamIds.get(game.homeTeamShortName)
    const awayTeamId = teamIds.get(game.awayTeamShortName)

    if (homeTeamId === undefined || awayTeamId === undefined) {
      skipped.push(`${game.externalId}(구단 매핑 실패: ${game.awayTeamShortName} vs ${game.homeTeamShortName})`)
      return []
    }

    const closed = now.getTime() >= Date.parse(game.startAt) - 60 * 60 * 1000
    const status = toGameStatus({ ...game, closed })
    const finished = hasFinalScore({ ...game, closed })

    return [
      {
        external_id: game.externalId,
        game_date: game.gameDate,
        start_at: game.startAt,
        home_team_id: homeTeamId,
        away_team_id: awayTeamId,
        status,
        // 취소 경기는 0:0 으로 오므로 스코어를 넣지 않는다(결과가 없는 것과 구분)
        home_score: finished ? game.homeScore : null,
        away_score: finished ? game.awayScore : null,
        // ⚠️ 이 플래그가 없으면 games_settled_has_scores 제약에 걸려 **배치 전체가 실패한다.**
        // 취소 경기는 status=settled 인데 스코어가 없어서 제약이 요구하는 조건을 못 채운다.
        // upsert 가 한 배치로 나가므로 취소 1건이 그날 5경기를 전부 막았다(2026-09-03).
        cancelled: isCancelled(game),
        // status=settled 는 취소 경기뿐이다. 정산 시각은 settle_game 이 채운다
        settled_at: isCancelled(game) ? now.toISOString() : null,
        // predict_close_at 은 DB 트리거가 채운다
        predict_close_at: game.startAt,
      },
    ]
  })

  if (rows.length === 0) return { upserted: 0, skipped }

  const { error } = await supabase
    .from('games')
    .upsert(rows, { onConflict: 'external_id', ignoreDuplicates: false })

  if (error !== null) throw new Error(`경기 upsert 실패: ${error.message}`)

  return { upserted: rows.length, skipped }
}

export interface SettleTarget {
  readonly id: string
  readonly external_id: string | null
  readonly game_date: string
  readonly home_score: number
  readonly away_score: number
}

/**
 * 정산 대상 — 결과가 확정됐는데 아직 우리 쪽 정산이 안 된 경기.
 *
 * **날짜 범위로 조회한다(자기복구).** 하루만 보면 그 하루의 실행이 전부 실패했을 때
 * 영구 미정산으로 남는다. 실제로 그렇게 됐다: GitHub Actions 가 예정된 실행 약 30회 중
 * 2회만 만들었고(schedule 은 부하 시 드롭된다), 그 사이에 끝난 경기가 `live` 로 멈췄다.
 *
 * 범위로 훑으면 실행이 몇 번 빠져도 다음 실행이 주워간다. 이미 정산된 경기는 제외되므로
 * 추가 비용은 조회 한 번뿐이다.
 */
export const gamesToSettle = async (
  supabase: Client,
  fromDate: string,
  toDate: string,
): Promise<readonly SettleTarget[]> => {
  const { data, error } = await supabase
    .from('games')
    .select('id, external_id, game_date, home_score, away_score')
    .gte('game_date', fromDate)
    .lte('game_date', toDate)
    .neq('status', 'settled')
    .not('home_score', 'is', null)
    .not('away_score', 'is', null)
    .order('game_date')

  if (error !== null) throw new Error(`정산 대상 조회 실패: ${error.message}`)

  return (data ?? []).flatMap((row) =>
    row.home_score === null || row.away_score === null
      ? []
      : [
          {
            id: row.id,
            external_id: row.external_id,
            game_date: row.game_date,
            home_score: row.home_score,
            away_score: row.away_score,
          },
        ],
  )
}

/** 정산 실행 — 예측 결과 확정 + 포인트 지급 + 내역 기록이 한 트랜잭션이다 */
export const settleGame = async (
  supabase: Client,
  gameId: string,
  homeScore: number,
  awayScore: number,
): Promise<void> => {
  const { error } = await supabase.rpc('settle_game', {
    target_game_id: gameId,
    final_home_score: homeScore,
    final_away_score: awayScore,
  })

  if (error !== null) throw new Error(`정산 실패(${gameId}): ${error.message}`)
}

export interface CrawlRunRecord {
  readonly targetDate: string
  readonly success: boolean
  readonly gamesFound: number
  readonly gamesSettled: number
  readonly error?: string
}

/**
 * 실행 이력 기록.
 *
 * 이게 없으면 "크롤링이 안 돌았는지"와 "경기가 없는 날인지"를 구분할 수 없다.
 * 실패해도 반드시 남긴다 — 어드민 크롤링 상태 배너가 이걸 읽는다.
 *
 * ⚠️ `target_date` 는 "이 날짜의 데이터를 수집했다"는 뜻이다. 여러 날짜를 수집했으면
 * **날짜마다 한 행**을 남겨야 한다. 시작일 한 행만 남기면 나머지 날짜는
 * 경기가 들어와 있는데도 어드민에서 "수집 이력 없음"으로 보인다.
 */
export const recordCrawlRuns = async (
  supabase: Client,
  records: readonly CrawlRunRecord[],
): Promise<void> => {
  if (records.length === 0) return

  const { error } = await supabase.from('crawl_runs').insert(
    records.map((record) => ({
      target_date: record.targetDate,
      success: record.success,
      games_found: record.gamesFound,
      games_settled: record.gamesSettled,
      error: record.error ?? null,
    })),
  )

  if (error !== null) {
    // 이력 기록 실패로 크롤링 자체를 실패시키지는 않는다. 로그만 남긴다.
    console.error('crawl_runs 기록 실패:', error.message)
  }
}

export const recordCrawlRun = async (supabase: Client, record: CrawlRunRecord): Promise<void> =>
  recordCrawlRuns(supabase, [record])
