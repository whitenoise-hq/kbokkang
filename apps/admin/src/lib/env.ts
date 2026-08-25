import { z } from 'zod'

/**
 * 환경변수 검증. 최초 접근 시점에 한 번만 파싱한다(빌드 타임에 터지지 않도록 지연 평가).
 */

const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('NEXT_PUBLIC_SUPABASE_URL 형식이 올바르지 않습니다'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY 가 없습니다'),
})

const serverEnvSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY 가 없습니다'),
})

type PublicEnv = z.infer<typeof publicEnvSchema>
type ServerEnv = z.infer<typeof serverEnvSchema>

const parseOrThrow = <T>(schema: z.ZodType<T>, source: unknown, scope: string): T => {
  const parsed = schema.safeParse(source)

  if (!parsed.success) {
    const detail = parsed.error.issues.map((issue) => issue.message).join(', ')
    throw new Error(`${scope} 환경변수 설정이 필요합니다: ${detail} (.env.example 참고)`)
  }

  return parsed.data
}

let publicEnvCache: PublicEnv | null = null
let serverEnvCache: ServerEnv | null = null

/** 브라우저에서도 접근 가능한 공개 환경변수 */
export const publicEnv = (): PublicEnv => {
  publicEnvCache ??= parseOrThrow(
    publicEnvSchema,
    {
      // Next.js는 빌드 시 정적 치환하므로 반드시 리터럴로 접근해야 한다.
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    },
    '공개',
  )

  return publicEnvCache
}

/** 서버 전용 환경변수. 클라이언트 컴포넌트에서 호출 금지. */
export const serverEnv = (): ServerEnv => {
  if (typeof window !== 'undefined') {
    throw new Error('serverEnv()는 서버에서만 호출할 수 있습니다')
  }

  serverEnvCache ??= parseOrThrow(
    serverEnvSchema,
    { SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY },
    '서버',
  )

  return serverEnvCache
}
