import { type Client, recordCrawlRuns, upsertGames } from './repository.ts'
import { fetchGames } from './naver.ts'
import { dateRange, shiftDate } from './date.ts'

/**
 * 주간 일정 수집 — 기준일 포함 7일치.
 *
 * 월요일에 돌려 그 주 일요일까지 받는다. **기준일(월)을 포함**하는 이유는
 * 월요일도 개막 주·시즌 막바지에 경기가 편성되기 때문이다
 * (2026 시즌 실측: 3/16, 3/23, 10/5 — 모두 13:00~14:00 낮경기).
 *
 * 이 잡은 "미리 채워두기" 최적화다. 정산 잡이 매일 오늘 경기를 upsert 하므로
 * 이 잡이 실패해도 서비스는 돌아간다(유저가 오늘 경기를 조금 늦게 보게 될 뿐).
 *
 * 이력은 **날짜마다 한 행**씩 남긴다. 시작일 한 행만 남기면 나머지 6일은 경기가
 * 들어와 있는데도 어드민 배너가 "수집 이력 없음"으로 표시한다(실제로 그랬다).
 */

/** 기준일 포함 7일 = 월~일 */
export const SCHEDULE_DAYS = 7

export interface ScheduleResult {
  readonly from: string
  readonly to: string
  readonly found: number
  readonly upserted: number
  readonly skippedGames: readonly string[]
}

export const runSchedule = async (
  supabase: Client,
  { from, now }: { from: string; now: Date },
): Promise<ScheduleResult> => {
  const dates = dateRange(from, SCHEDULE_DAYS)
  const to = shiftDate(from, SCHEDULE_DAYS - 1)

  const games = await fetchGames(from, to)
  const upsert = await upsertGames(supabase, games, now)

  // 경기 0건인 날짜도 행을 남긴다 — 그게 "경기 없는 날"의 증거다
  await recordCrawlRuns(
    supabase,
    dates.map((date) => ({
      targetDate: date,
      success: true,
      gamesFound: games.filter((game) => game.gameDate === date).length,
      gamesSettled: 0,
      ...(upsert.skipped.length > 0 ? { error: `건너뜀: ${upsert.skipped.join(', ')}` } : {}),
    })),
  )

  return { from, to, found: games.length, upserted: upsert.upserted, skippedGames: upsert.skipped }
}
