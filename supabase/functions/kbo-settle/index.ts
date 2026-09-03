import { isServiceRoleCaller } from '../_shared/auth.ts'
import { functionEnv } from '../_runtime/env.ts'
import { todayKst } from '../_shared/date.ts'
import { createServiceClient } from '../_shared/repository.ts'
import { runSettle } from '../_shared/settle.ts'

/**
 * 결과 수집 + 정산 — Supabase Cron(pg_cron)이 30분 간격으로 호출한다.
 *
 * GitHub Actions `schedule` 에서 옮겨온 이유: 예정된 실행 약 30회 중 2~4회만
 * 실제로 만들어졌다(부하 시 큐 작업이 버려진다 — 문서화된 동작). 실효 간격이
 * 4~5시간이 되어 정산이 경기 종료 후 2시간 30분 뒤에 됐다.
 * pg_cron 은 Postgres 안에서 돌아 큐 대기도 결번도 없다.
 *
 * cron 은 고정 간격이지만 **실제 일은 게이트가 판단한다**(`_shared/gate.ts`) —
 * 첫 경기 시작 1시간 전부터, 전 경기 정산 완료까지만 소스를 부른다.
 *
 * 수동 복구: `{"date":"2026-09-01","force":true}` 를 POST 한다.
 */
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

interface RequestBody {
  readonly date?: unknown
  readonly force?: unknown
}

const parseBody = async (request: Request): Promise<{ date: string; force: boolean }> => {
  const fallback = { date: todayKst(), force: false }

  if (request.method !== 'POST') return fallback

  let body: RequestBody
  try {
    body = (await request.json()) as RequestBody
  } catch {
    // pg_cron 은 본문 없이 부른다. 그건 정상이다.
    return fallback
  }

  const date =
    typeof body.date === 'string' && DATE_PATTERN.test(body.date) ? body.date : fallback.date

  return { date, force: body.force === true }
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
    // anon key 로도 verify_jwt 는 통과한다. 그래서 여기서 한 번 더 막는다.
    return Response.json({ error: 'unauthorized' }, { status: 401 })
  }

  const { date, force } = await parseBody(request)
  const supabase = createServiceClient(env.supabaseUrl, env.serviceRoleKey)

  try {
    const result = await runSettle(supabase, { today: date, now: new Date(), force })

    if (result.skipped) {
      console.info(`건너뜀 — ${result.reason}`)
    } else {
      console.info(
        `${result.from} ~ ${result.to}: ${String(result.found)}경기 조회 / ${String(result.upserted)}건 반영 / ${String(result.settled)}건 정산`,
      )
      if (result.skippedGames.length > 0) console.warn(result.skippedGames.join('; '))
    }

    return Response.json(result)
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : String(cause)
    console.error('정산 실패:', message)
    return Response.json({ error: message }, { status: 500 })
  }
})
