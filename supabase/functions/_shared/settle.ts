import {
  type Client,
  gamesToSettle,
  recordCrawlRuns,
  settleGame,
  upsertGames,
} from './repository.ts'
import { fetchGames } from './naver.ts'
import { shiftDate } from './date.ts'
import { shouldRunSettle } from './gate.ts'

/**
 * 결과 수집 + 정산.
 *
 * ## 자기복구 (중요)
 *
 * **오늘만 보지 않고 최근 3일을 훑는다.** 하루만 보면 그 하루의 실행이 전부 실패했을 때
 * 영구 미정산으로 남는다. 실제로 그렇게 됐다: GitHub Actions 가 예정된 실행 약 30회 중
 * 2회만 만들었고, 그 사이 끝난 경기가 `live` 로 멈춰 아무도 다시 보지 않았다.
 *
 * 범위로 훑으면 실행이 몇 번 빠져도 다음 실행이 주워간다. 플랫폼을 바꿔도 이 방어선은 남긴다 —
 * 새 플랫폼도 장애가 날 수 있다.
 *
 * 소스는 기간 조회를 지원하므로 3일치도 **HTTP 요청 한 번**이다.
 */

/** 기준일 포함 최근 며칠을 훑을지. 우천 순연·연속 장애를 흡수할 만큼은 되어야 한다. */
export const LOOKBACK_DAYS = 3

export interface SettleOptions {
  /** 기준일(KST, YYYY-MM-DD). 이 날짜까지 LOOKBACK_DAYS 일을 훑는다 */
  readonly today: string
  readonly now: Date
  /** 게이트를 무시하고 무조건 실행 — 수동 복구용 */
  readonly force?: boolean
}

export interface SettleResult {
  readonly from: string
  readonly to: string
  readonly skipped: boolean
  readonly reason: string
  readonly found: number
  readonly upserted: number
  readonly settled: number
  readonly skippedGames: readonly string[]
}

export const runSettle = async (
  supabase: Client,
  { today, now, force = false }: SettleOptions,
): Promise<SettleResult> => {
  const to = today
  const from = shiftDate(to, -(LOOKBACK_DAYS - 1))

  const empty = { from, to, found: 0, upserted: 0, settled: 0, skippedGames: [] as string[] }

  if (!force) {
    const gate = await shouldRunSettle(supabase, { from, to, now })
    if (!gate.shouldRun) return { ...empty, skipped: true, reason: gate.reason }
  }

  try {
    return await settlePass(supabase, { from, to, now, force })
  } catch (cause) {
    // ⚠️ **실패도 반드시 기록한다.** 기록하지 않으면 조용히 실패한다 —
    // 2026-09-03 에 취소 경기 때문에 34회 연속 실패했는데 crawl_runs 에 아무것도 남지
    // 않아서, 경기가 미정산으로 남은 것을 사람이 눈치채기 전까지 아무도 몰랐다.
    // crawl_runs 가 존재하는 이유가 이것이다.
    const message = cause instanceof Error ? cause.message : String(cause)

    await recordCrawlRuns(supabase, [
      { targetDate: to, success: false, gamesFound: 0, gamesSettled: 0, error: message },
    ])

    throw cause
  }
}

/** 실제 수집·정산. 실패 기록은 호출자(`runSettle`)가 담당한다. */
const settlePass = async (
  supabase: Client,
  { from, to, now, force }: { from: string; to: string; now: Date; force: boolean },
): Promise<SettleResult> => {
  const games = await fetchGames(from, to)
  const upsert = await upsertGames(supabase, games, now)
  const pending = await gamesToSettle(supabase, from, to)

  /** 어느 날짜를 정산했는지 — crawl_runs 에 그 날짜 행도 남기기 위해 모은다 */
  const settledDates = new Set<string>()
  const failures: string[] = []
  let settled = 0

  for (const game of pending) {
    try {
      await settleGame(supabase, game.id, game.home_score, game.away_score)
      settled += 1
      settledDates.add(game.game_date)
    } catch (cause) {
      // 한 경기 정산 실패가 나머지를 막지 않게 한다
      const detail = cause instanceof Error ? cause.message : String(cause)
      failures.push(`${game.external_id ?? game.id}: ${detail}`)
    }
  }

  const notes = [...upsert.skipped, ...failures]

  // 기준일은 항상 남기고, 복구한 지난 날짜도 함께 남긴다.
  // (각 날짜의 최초 수집 이력은 주 1회 일정 잡이 이미 남긴다)
  const dates = [...new Set([to, ...settledDates])].toSorted()

  await recordCrawlRuns(
    supabase,
    dates.map((date) => ({
      targetDate: date,
      success: failures.length === 0,
      gamesFound: games.filter((game) => game.gameDate === date).length,
      gamesSettled: pending.filter((game) => game.game_date === date).length,
      ...(notes.length > 0 ? { error: notes.join('; ') } : {}),
    })),
  )

  return {
    from,
    to,
    skipped: false,
    reason: force ? '강제 실행' : '처리 구간',
    found: games.length,
    upserted: upsert.upserted,
    settled,
    skippedGames: notes,
  }
}
