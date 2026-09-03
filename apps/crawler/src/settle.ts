import { createServiceClient } from '../../../supabase/functions/_shared/repository.ts'
import { runSettle } from '../../../supabase/functions/_shared/settle.ts'
import { env } from './env'
import { targetDate } from './args'

/**
 * 로컬/Actions 수동 복구용 CLI.
 *
 * ⚠️ **로직은 `supabase/functions/_shared/` 에 한 벌만 있다.** 이 파일은 그걸 부르는 껍데기다.
 * 정기 실행은 Supabase Cron 이 Edge Function 을 부르는 경로다(GitHub Actions schedule 은
 * 실행을 버려서 못 쓴다 — CLAUDE.md 참조).
 *
 * `--date=YYYY-MM-DD` 로 기준일 지정. CLI 는 항상 `force` 다 —
 * 사람이 직접 부른 것이므로 게이트로 막지 않는다.
 */
const run = async (): Promise<void> => {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = env()
  const supabase = createServiceClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  try {
    const result = await runSettle(supabase, {
      today: targetDate(),
      now: new Date(),
      force: true,
    })

    console.info(
      `${result.from} ~ ${result.to}: ${String(result.found)}경기 조회 / ${String(result.upserted)}건 반영 / ${String(result.settled)}건 정산`,
    )
    if (result.skippedGames.length > 0) console.warn(result.skippedGames.join('; '))
  } catch (cause) {
    console.error('정산 실패:', cause instanceof Error ? cause.message : cause)
    process.exitCode = 1
  }
}

await run()
