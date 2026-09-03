import { createServiceClient } from '../../../supabase/functions/_shared/repository.ts'
import { runSchedule } from '../../../supabase/functions/_shared/schedule.ts'
import { env } from './env'
import { targetDate } from './args'

/**
 * 로컬/Actions 수동 복구용 CLI. 로직은 `supabase/functions/_shared/schedule.ts` 한 벌뿐이다.
 *
 * `--date=YYYY-MM-DD` 로 시작일 지정(기본값 오늘). 기준일 포함 7일치를 받는다.
 */
const run = async (): Promise<void> => {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = env()
  const supabase = createServiceClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  try {
    const result = await runSchedule(supabase, { from: targetDate(), now: new Date() })

    console.info(
      `일정 수집: ${result.from} ~ ${result.to}, ${String(result.found)}경기 조회 / ${String(result.upserted)}건 반영`,
    )
    if (result.skippedGames.length > 0) console.warn(result.skippedGames.join('; '))
  } catch (cause) {
    console.error('일정 수집 실패:', cause instanceof Error ? cause.message : cause)
    process.exitCode = 1
  }
}

await run()
