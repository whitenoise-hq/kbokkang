import { client, recordCrawlRuns, upsertGames } from './repository'
import { fetchGames } from './sources/naver'
import { dateRange, shiftDate } from './date'
import { targetDate } from './args'

/** 실행일 포함 7일 = 월~일 */
const DAYS = 7

/**
 * 일정 수집 — 매주 월요일 KST 10:00 실행 (GitHub Actions cron `0 1 * * 1`).
 *
 * 실행일을 **포함해** 7일치(월~일)를 가져온다.
 * 월요일은 보통 휴식일이지만 개막 주와 시즌 막바지에 경기가 편성된다
 * (2026 시즌 실측: 3/16, 3/23, 10/5 — 모두 13:00~14:00 낮경기).
 * 화요일부터 받으면 그 월요일 경기가 누락되므로 실행일을 포함해야 한다.
 *
 * 이 액션은 "미리 채워두기" 최적화다. 정산 액션이 매일 오늘 경기를 upsert 하므로
 * 이 액션이 실패해도 서비스는 돌아간다(유저가 오늘 경기를 조금 늦게 보게 될 뿐).
 *
 * `--date=YYYY-MM-DD` 로 시작일을 지정할 수 있다 — 수집이 빠진 주를 다시 채울 때 쓴다.
 *
 * 이력은 **날짜마다 한 행**씩 남긴다. 시작일 한 행만 남기면 나머지 6일은 경기가
 * 들어와 있는데도 어드민에서 "수집 이력 없음"으로 보인다(실제로 그렇게 보였다).
 */
const run = async (): Promise<void> => {
  const now = new Date()
  const from = targetDate()
  const dates = dateRange(from, DAYS)
  const to = shiftDate(from, DAYS - 1)

  const supabase = client()

  try {
    const games = await fetchGames(from, to)

    const result = await upsertGames(supabase, games, now)

    console.info(
      `일정 수집 완료: ${from} ~ ${to}, ${String(games.length)}경기 조회 / ${String(result.upserted)}건 반영`,
    )
    if (result.skipped.length > 0) {
      console.warn(`건너뛴 경기 ${String(result.skipped.length)}건: ${result.skipped.join(', ')}`)
    }

    // 경기 0건인 날짜도 행을 남긴다 — 그게 "경기 없는 날"의 증거다
    await recordCrawlRuns(
      supabase,
      dates.map((date) => ({
        targetDate: date,
        success: true,
        gamesFound: games.filter((game) => game.gameDate === date).length,
        gamesSettled: 0,
        ...(result.skipped.length > 0 ? { error: `건너뜀: ${result.skipped.join(', ')}` } : {}),
      })),
    )
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : String(cause)
    console.error('일정 수집 실패:', message)

    // 실패도 날짜마다 남긴다. 안 그러면 배너가 "실패"와 "미실행"을 구분하지 못한다.
    await recordCrawlRuns(
      supabase,
      dates.map((date) => ({
        targetDate: date,
        success: false,
        gamesFound: 0,
        gamesSettled: 0,
        error: message,
      })),
    )

    process.exitCode = 1
  }
}

await run()
