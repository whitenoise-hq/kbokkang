/**
 * 호출자 인증 — service role 호출만 허용한다.
 *
 * ⚠️ Edge Function 의 기본 `verify_jwt` 로는 부족하다. **anon key 도 유효한 JWT** 라서,
 * 그것만 믿으면 anon key 를 가진 누구나(앱에 배포되므로 공개다) 크롤러를 실행시킬 수 있다.
 * 정산 자체는 멱등이지만 소스 호출이 늘어나 비공식 API 접근이 차단될 수 있다.
 *
 * ## 키 형식이 두 가지다 (실제로 걸렸다)
 *
 * Supabase 가 API 키 체계를 이전하는 중이라 한 프로젝트에 두 형식이 공존한다:
 * - **신규**: `sb_secret_...` (41자). Edge Function 에 `SUPABASE_SERVICE_ROLE_KEY` 로 주입되는 값
 * - **레거시**: `eyJ...` JWT (219자). 어드민 `.env` 와 기존 도구들이 쓰는 값
 *
 * 그래서 "주입된 키와 같은지"만 보면 레거시 JWT 로 부르는 호출이 전부 막힌다.
 * 두 경로를 모두 받는다:
 *
 * 1. 주입된 키와 정확히 일치 (신규 형식)
 * 2. JWT 의 `role` 클레임이 `service_role` (레거시 형식)
 *
 * ⚠️ 2번은 **게이트웨이가 서명을 이미 검증했다는 전제**에 의존한다(`verify_jwt` 기본값 true).
 *    `verify_jwt = false` 로 바꾸면 클레임을 위조할 수 있으므로 이 가드가 무력해진다.
 *    끄지 말 것.
 */

/** 길이 비교 후 전체를 훑는다 — 앞자리만 맞춰가며 탐색하는 것을 막는다 */
const timingSafeEqual = (a: string, b: string): boolean => {
  if (a.length !== b.length) return false

  let diff = 0
  for (let index = 0; index < a.length; index += 1) {
    diff |= a.charCodeAt(index) ^ b.charCodeAt(index)
  }

  return diff === 0
}

const base64UrlDecode = (segment: string): string => {
  const padded = segment.replaceAll('-', '+').replaceAll('_', '/')
  const withPadding = padded.padEnd(padded.length + ((4 - (padded.length % 4)) % 4), '=')
  return atob(withPadding)
}

/**
 * JWT 의 `role` 클레임을 읽는다. **서명은 검증하지 않는다** — 게이트웨이가 이미 했다.
 * 형식이 JWT 가 아니거나 파싱에 실패하면 null.
 */
export const roleClaimOf = (token: string): string | null => {
  const parts = token.split('.')
  if (parts.length !== 3) return null

  const payload = parts[1]
  if (payload === undefined) return null

  try {
    const decoded: unknown = JSON.parse(base64UrlDecode(payload))
    if (typeof decoded !== 'object' || decoded === null) return null

    const role = (decoded as { role?: unknown }).role
    return typeof role === 'string' ? role : null
  } catch {
    return null
  }
}

export const bearerTokenOf = (request: Request): string | null => {
  const header = request.headers.get('Authorization') ?? ''
  const prefix = 'Bearer '

  if (!header.startsWith(prefix)) return null

  const token = header.slice(prefix.length).trim()
  return token === '' ? null : token
}

export const isServiceRoleCaller = (request: Request, injectedServiceKey: string): boolean => {
  const token = bearerTokenOf(request)
  if (token === null) return false

  if (timingSafeEqual(token, injectedServiceKey)) return true

  return roleClaimOf(token) === 'service_role'
}
