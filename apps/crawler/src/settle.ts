import { client, gamesToSettle, recordCrawlRuns, settleGame, upsertGames } from './repository'
import { fetchGames } from './sources/naver'
import { shiftDate } from './date'
import { targetDate } from './args'

/**
 * 결과 수집 + 정산 — 매일 KST 10:07~00:37 30분 간격 (cron `7,37 1-15 * * *`).
 *
 * ## 자기복구 (중요)
 *
 * **오늘만 보지 않고 최근 3일을 훑는다.** 하루만 보면 그 하루의 실행이 전부 실패했을 때
 * 영구 미정산으로 남는다. 실제로 그렇게 됐다:
 *
 * - 2026-09-01, 예정된 실행 약 30회 중 GitHub Actions 가 만든 것은 2회뿐이었다.
 *   `schedule` 이벤트는 부하 시 지연되고 **큐에 들어간 작업이 버려진다**(문서화된 동작).
 * - 그 사이에 경기가 끝났고, 다음 실행은 이미 날짜가 바뀌어 9/2 를 보고 있었다.
 *   9/1 5경기가 `live` 상태로 멈춰 아무도 다시 보지 않았다.
 *
 * 범위로 훑으면 실행이 몇 번 빠져도 다음 실행이 주워간다. 지연 정산 정책이 이 지연을 허용한다.
 * cron 창이 KST 자정을 넘어가도(00:07·00:37) 어제가 창 안에 있으므로 문제가 되지 않는다.
 *
 * 소스는 기간 조회를 지원하므로 3일치도 **HTTP 요청 한 번**이다.
 *
 * `--date=YYYY-MM-DD` 로 기준일을 바꿀 수 있다(그 날짜까지 3일을 훑는다).
 */

/** 기준일 포함 최근 며칠을 훑을지. 우천 순연·연휴 연속 장애를 흡수할 만큼은 되어야 한다. */
const LOOKBACK_DAYS = 3

const run = async (): Promise<void> => {
  const now = new Date()
  const to = targetDate()
  const from = shiftDate(to, -(LOOKBACK_DAYS - 1))

  const supabase = client()
  let found = 0
  let settled = 0

  try {
    const { data: windowRows, error: windowError } = await supabase
      .from('games')
      .select('status')
      .gte('game_date', from)
      .lte('game_date', to)

    if (windowError !== null) throw new Error(`경기 조회 실패: ${windowError.message}`)

    const rows = windowRows ?? []

    // 창 안이 전부 정산 완료면 소스를 부르지 않는다(경기 없는 날도 여기서 끝난다).
    // 경기가 0건이면 아직 등록되지 않았을 수 있으므로 소스를 확인한다.
    if (rows.length > 0 && rows.every((row) => row.status === 'settled')) {
      console.info(`${from} ~ ${to}: 모든 경기 정산 완료. 종료`)
      return
    }

    const games = await fetchGames(from, to)
    found = games.length

    const upsert = await upsertGames(supabase, games, now)
    if (upsert.skipped.length > 0) {
      console.warn(`건너뛴 경기 ${String(upsert.skipped.length)}건: ${upsert.skipped.join(', ')}`)
    }

    const pending = await gamesToSettle(supabase, from, to)
    /** 어느 날짜를 정산했는지 — crawl_runs 에 그 날짜 행도 남기기 위해 모은다 */
    const settledDates = new Set<string>()

    for (const game of pending) {
      try {
        await settleGame(supabase, game.id, game.home_score, game.away_score)
        settled += 1
        settledDates.add(game.game_date)

        const late = game.game_date === to ? '' : ' (지난 날짜 복구)'
        console.info(
          `정산 완료: ${game.external_id ?? game.id} ${String(game.away_score)}:${String(game.home_score)}${late}`,
        )
      } catch (cause) {
        // 한 경기 정산 실패가 나머지를 막지 않게 한다
        console.error(
          `정산 실패(${game.external_id ?? game.id}):`,
          cause instanceof Error ? cause.message : cause,
        )
      }
    }

    console.info(
      `${from} ~ ${to}: ${String(found)}경기 조회 / ${String(upsert.upserted)}건 반영 / ${String(settled)}건 정산`,
    )

    // 기준일은 항상 남기고, 복구한 지난 날짜도 함께 남긴다.
    // (각 날짜의 최초 수집 이력은 주 1회 일정 액션이 이미 남긴다)
    const dates = [...new Set([to, ...settledDates])].toSorted()

    await recordCrawlRuns(
      supabase,
      dates.map((date) => ({
        targetDate: date,
        success: true,
        gamesFound: games.filter((game) => game.gameDate === date).length,
        gamesSettled: pending.filter((game) => game.game_date === date).length,
        ...(upsert.skipped.length > 0 ? { error: `건너뜀: ${upsert.skipped.join(', ')}` } : {}),
      })),
    )
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : String(cause)
    console.error('결과 수집 실패:', message)

    await recordCrawlRuns(supabase, [
      { targetDate: to, success: false, gamesFound: found, gamesSettled: settled, error: message },
    ])

    process.exitCode = 1
  }
}

await run()
