import { client, gamesToSettle, recordCrawlRun, settleGame, upsertGames } from './repository'
import { fetchGames } from './sources/naver'
import { targetDate } from './args'

/**
 * 결과 수집 + 정산 — 매일 KST 10:00~24:00 30분 간격 (cron `0,30 1-15 * * *`).
 *
 * 기획서 3장의 "적응형" 정책을 따른다:
 * 안 끝난 경기만 확인하고, 모든 경기가 정산되면 그날 작업을 끝낸다.
 * 경기 없는 날(월요일 등)은 DB 조회 한 번으로 즉시 종료된다.
 *
 * 오늘 경기를 소스에서 받아 **upsert 까지** 하므로 일정 보정도 겸한다:
 * - 우천 취소(전체의 8%)가 30분 안에 반영된다
 * - 시작 시각 변경이 반영된다
 * - 월요일 일정 액션이 실패해도 당일 경기가 등록된다
 *
 * `--date=YYYY-MM-DD` 로 과거 날짜를 정산할 수 있다 — 수집이 멈췄던 날의 복구 경로다.
 */
const run = async (): Promise<void> => {
  const now = new Date()
  const today = targetDate()
  const supabase = client()

  let found = 0
  let settled = 0

  try {
    // 이미 오늘 할 일이 끝났으면 소스를 부르지 않는다(불필요한 요청을 줄인다)
    const { data: todayRows, error: todayError } = await supabase
      .from('games')
      .select('id, status')
      .eq('game_date', today)

    if (todayError !== null) throw new Error(`오늘 경기 조회 실패: ${todayError.message}`)

    const rows = todayRows ?? []

    if (rows.length > 0 && rows.every((row) => row.status === 'settled')) {
      console.info(`${today}: 모든 경기 정산 완료. 종료`)
      return
    }

    const games = await fetchGames(today, today)
    found = games.length

    if (found === 0 && rows.length === 0) {
      console.info(`${today}: 경기 없음`)
      await recordCrawlRun(supabase, { targetDate: today, success: true, gamesFound: 0, gamesSettled: 0 })
      return
    }

    const upsert = await upsertGames(supabase, games, now)
    if (upsert.skipped.length > 0) {
      console.warn(`건너뛴 경기 ${String(upsert.skipped.length)}건: ${upsert.skipped.join(', ')}`)
    }

    // upsert 로 스코어가 채워진 경기를 정산한다
    const pending = await gamesToSettle(supabase, today)

    for (const game of pending) {
      try {
        await settleGame(supabase, game.id, game.home_score, game.away_score)
        settled += 1
        console.info(`정산 완료: ${game.external_id ?? game.id} ${String(game.away_score)}:${String(game.home_score)}`)
      } catch (cause) {
        // 한 경기 정산 실패가 나머지를 막지 않게 한다
        console.error(`정산 실패(${game.external_id ?? game.id}):`, cause instanceof Error ? cause.message : cause)
      }
    }

    console.info(
      `${today}: ${String(found)}경기 조회 / ${String(upsert.upserted)}건 반영 / ${String(settled)}건 정산`,
    )

    await recordCrawlRun(supabase, {
      targetDate: today,
      success: true,
      gamesFound: found,
      gamesSettled: settled,
      ...(upsert.skipped.length > 0 ? { error: `건너뜀: ${upsert.skipped.join(', ')}` } : {}),
    })
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : String(cause)
    console.error('결과 수집 실패:', message)

    await recordCrawlRun(supabase, {
      targetDate: today,
      success: false,
      gamesFound: found,
      gamesSettled: settled,
      error: message,
    })

    process.exitCode = 1
  }
}

await run()
