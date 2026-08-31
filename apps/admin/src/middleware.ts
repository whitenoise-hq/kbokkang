import { NextResponse, type NextRequest } from 'next/server'
import { isAdmin, updateSession } from '@/lib/supabase/middleware'

const LOGIN_PATH = '/login'

/**
 * 어드민 접근 가드 — 어드민 기획서 5.2.
 *
 * 이 미들웨어가 없으면 URL 만 알아도 모든 화면이 열린다.
 * 역할 검사는 반드시 서버에서 한다(클라이언트 검사만으로는 우회 가능).
 */
export const middleware = async (request: NextRequest) => {
  const { response, user } = await updateSession(request)
  const { pathname, search } = request.nextUrl
  const onLoginPage = pathname === LOGIN_PATH
  const admin = isAdmin(user)

  // 로그인 안 됨 → 로그인 화면으로. 원래 가려던 경로를 남겨 로그인 후 복귀시킨다
  if (user === null && !onLoginPage) {
    const url = request.nextUrl.clone()
    url.pathname = LOGIN_PATH
    url.search = ''
    if (pathname !== '/') url.searchParams.set('redirect', `${pathname}${search}`)

    return NextResponse.redirect(url)
  }

  /**
   * 로그인은 됐지만 운영자가 아님 → 로그인 화면에서 사유를 알린다.
   * 로그인 화면은 운영자만 홈으로 보내므로(아래) 리다이렉트 루프가 생기지 않는다.
   */
  if (user !== null && !admin && !onLoginPage) {
    const url = request.nextUrl.clone()
    url.pathname = LOGIN_PATH
    url.search = ''
    url.searchParams.set('error', 'forbidden')

    return NextResponse.redirect(url)
  }

  // 이미 운영자로 로그인한 상태에서 로그인 화면 → 홈
  if (admin && onLoginPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    url.search = ''

    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  /**
   * 정적 자산과 이미지 최적화 경로는 제외한다.
   * 세션 갱신을 위해 그 외 모든 경로에서 동작해야 한다.
   */
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2)$).*)',
  ],
}
