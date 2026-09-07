import { z } from 'zod'

/**
 * 앱 환경변수.
 *
 * ⚠️ 클라이언트에는 **anon key 만** 넣는다. service role key 는 절대 금지 —
 * RN 번들은 뜯어볼 수 있고, `EXPO_PUBLIC_*` 는 빌드 시점에 코드로 인라인된다.
 *
 * ⚠️ `process.env.EXPO_PUBLIC_*` 는 **리터럴로 접근**해야 한다(빌드 시 정적 치환).
 *    동적 키(`process.env[name]`)로 읽으면 값이 들어가지 않는다.
 *
 * ⚠️ `.env` 를 바꾸면 Release 번들에 이미 인라인된 값이 남는다 →
 *    `expo start --clear` 또는 Xcode Clean Build 필요(플레이북).
 */
const schema = z.object({
  supabaseUrl: z.string().url('EXPO_PUBLIC_SUPABASE_URL 형식이 올바르지 않습니다'),
  supabaseAnonKey: z.string().min(1, 'EXPO_PUBLIC_SUPABASE_ANON_KEY 가 없습니다'),
})

const parsed = schema.safeParse({
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
})

if (!parsed.success) {
  const detail = parsed.error.issues.map((issue) => issue.message).join(', ')
  throw new Error(`환경변수 설정이 필요합니다: ${detail} (.env.example 참고)`)
}

export const env = parsed.data
