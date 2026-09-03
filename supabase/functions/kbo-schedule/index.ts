import { isServiceRoleCaller } from '../_shared/auth.ts'
import { functionEnv } from '../_runtime/env.ts'
import { todayKst } from '../_shared/date.ts'
import { createServiceClient } from '../_shared/repository.ts'
import { runSchedule } from '../_shared/schedule.ts'

/**
 * 주간 일정 수집 — Supabase Cron 이 월요일 KST 09:00 에 호출한다.
 *
 * 기준일 포함 7일치를 받는다. 빠진 주를 다시 채울 때는
 * `{"date":"2026-09-07"}` 를 POST 한다.
 */
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

const parseDate = async (request: Request): Promise<string> => {
  if (request.method !== 'POST') return todayKst()

  try {
    const body = (await request.json()) as { date?: unknown }
    return typeof body.date === 'string' && DATE_PATTERN.test(body.date) ? body.date : todayKst()
  } catch {
    // pg_cron 은 본문 없이 부른다
    return todayKst()
  }
}

Deno.serve(async (request) => {
  let env
  try {
    env = functionEnv()
  } catch (cause) {
    console.error('환경변수 오류:', cause instanceof Error ? cause.message : cause)
    return Response.json({ error: 'server misconfigured' }, { status: 500 })
  }

  if (!isServiceRoleCaller(request, env.serviceRoleKey)) {
    return Response.json({ error: 'unauthorized' }, { status: 401 })
  }

  const from = await parseDate(request)
  const supabase = createServiceClient(env.supabaseUrl, env.serviceRoleKey)

  try {
    const result = await runSchedule(supabase, { from, now: new Date() })

    console.info(
      `일정 수집: ${result.from} ~ ${result.to}, ${String(result.found)}경기 조회 / ${String(result.upserted)}건 반영`,
    )
    if (result.skippedGames.length > 0) console.warn(result.skippedGames.join('; '))

    return Response.json(result)
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : String(cause)
    console.error('일정 수집 실패:', message)
    return Response.json({ error: message }, { status: 500 })
  }
})
