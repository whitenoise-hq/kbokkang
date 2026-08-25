import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { publicEnv, serverEnv } from '@/lib/env'

/**
 * 서버 컴포넌트 / 서버 액션 / 라우트 핸들러용 Supabase 클라이언트.
 * 로그인 세션(쿠키)을 그대로 사용하므로 RLS가 적용된다.
 */
export const createClient = async () => {
  const { NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY } = publicEnv()
  const cookieStore = await cookies()

  return createServerClient(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        } catch (error) {
          // 서버 컴포넌트에서는 쿠키 쓰기가 불가능하다.
          // 세션 갱신은 middleware가 담당하므로 여기서는 무시해도 안전하다.
          if (process.env.NODE_ENV === 'development') {
            console.warn('쿠키 쓰기를 건너뜁니다(서버 컴포넌트 컨텍스트):', error)
          }
        }
      },
    },
  })
}

/**
 * RLS를 우회하는 관리자 클라이언트(service role).
 * 도감번호 자동 부여, 정산, 수동 포인트 조정처럼 서버에서만 수행하는 작업에 사용한다.
 * 절대 클라이언트 코드에서 import하지 말 것.
 */
export const createAdminClient = () => {
  const { NEXT_PUBLIC_SUPABASE_URL } = publicEnv()
  const { SUPABASE_SERVICE_ROLE_KEY } = serverEnv()

  return createServerClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    cookies: {
      getAll: () => [],
      setAll: () => {
        // service role 클라이언트는 세션을 쓰지 않는다.
      },
    },
  })
}
