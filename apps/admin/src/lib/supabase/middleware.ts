import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { User } from '@supabase/supabase-js'
import type { Database } from '@kbokkang/shared'
import { publicEnv } from '@/lib/env'

/**
 * 미들웨어에서 세션을 갱신하고 유저를 조회한다.
 *
 * 주의: 여기서는 `getSession()`이 아니라 **`getUser()`**를 쓴다.
 * getSession 은 쿠키를 검증 없이 읽어 위조가 가능하고, getUser 는 Auth 서버에서 JWT 를 검증한다.
 *
 * 쿠키 조작(request.cookies.set 등)은 @supabase/ssr 이 요구하는 정해진 형태라
 * 프로젝트의 불변성 규칙에서 예외로 둔다.
 */
export const updateSession = async (
  request: NextRequest,
): Promise<{ response: NextResponse; user: User | null }> => {
  const { NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY } = publicEnv()

  let response = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value)
          })

          response = NextResponse.next({ request })

          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  return { response, user }
}

/**
 * 운영자 여부. 권한은 auth.users.app_metadata.role 에 저장한다.
 *
 * user_metadata 를 보면 안 된다 — 유저가 직접 수정할 수 있어 누구나 admin 이 될 수 있다.
 * app_metadata 는 service role 만 수정 가능하다.
 */
export const isAdmin = (user: User | null): boolean =>
  user !== null && user.app_metadata.role === 'admin'
