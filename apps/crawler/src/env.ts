import { z } from 'zod'

/**
 * 크롤러 환경변수. GitHub Actions Secrets 로 주입한다.
 *
 * 크롤러는 service role 로 붙는다 — games upsert, settle_game RPC, crawl_runs 기록이
 * 모두 RLS/정책으로 유저에게 막혀 있는 작업이기 때문이다.
 */
const schema = z.object({
  SUPABASE_URL: z.string().url('SUPABASE_URL 형식이 올바르지 않습니다'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY 가 없습니다'),
})

export const env = (): z.infer<typeof schema> => {
  const parsed = schema.safeParse({
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  })

  if (!parsed.success) {
    const detail = parsed.error.issues.map((issue) => issue.message).join(', ')
    throw new Error(`크롤러 환경변수 설정이 필요합니다: ${detail}`)
  }

  return parsed.data
}
