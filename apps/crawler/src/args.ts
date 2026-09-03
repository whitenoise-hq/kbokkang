import { z } from 'zod'
import { todayKst } from '../../../supabase/functions/_shared/date.ts'

/**
 * 실행 인자 파싱 — `--date=YYYY-MM-DD`.
 *
 * 기본값은 오늘(KST)이라 cron 실행은 인자가 필요 없다.
 * 날짜를 넘길 수 있어야 하는 이유는 **복구**다: 수집이 실패한 날짜를
 * workflow_dispatch 로 다시 돌릴 수 있어야 한다(경기마다 수동 정산하는 것보다 낫다).
 */
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date 는 YYYY-MM-DD 형식이어야 합니다')

export const targetDate = (argv: readonly string[] = process.argv.slice(2)): string => {
  const flag = argv.find((arg) => arg.startsWith('--date='))
  if (flag === undefined) return todayKst()

  const raw = flag.slice('--date='.length)
  // 빈 값은 인자를 안 준 것으로 본다 — Actions 에서 `--date=` 가 그대로 들어올 수 있다
  if (raw === '') return todayKst()

  const parsed = dateSchema.safeParse(raw)
  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((issue) => issue.message).join(', '))
  }

  // 형식만 맞고 실제로 없는 날짜(2026-02-30 등)를 걸러낸다
  const asDate = new Date(`${parsed.data}T00:00:00Z`)
  if (Number.isNaN(asDate.getTime()) || !asDate.toISOString().startsWith(parsed.data)) {
    throw new Error(`존재하지 않는 날짜입니다: ${raw}`)
  }

  return parsed.data
}
