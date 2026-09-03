import { describe, expect, it } from 'vitest'
import {
  bearerTokenOf,
  isServiceRoleCaller,
  roleClaimOf,
} from '../../../supabase/functions/_shared/auth.ts'

/** 서명은 검증하지 않으므로(게이트웨이 담당) 페이로드만 있는 토큰으로 충분하다 */
const jwtWith = (payload: Record<string, unknown>): string => {
  const encode = (value: object): string =>
    Buffer.from(JSON.stringify(value)).toString('base64url')
  return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode(payload)}.sig`
}

const requestWith = (auth?: string): Request =>
  new Request('https://example.test', {
    method: 'POST',
    ...(auth === undefined ? {} : { headers: { Authorization: auth } }),
  })

/**
 * 주입되는 신규 형식 키를 대신하는 더미.
 *
 * 실제 형식은 `sb_secret_...` 이지만 **그 접두어를 그대로 쓰면 안 된다** —
 * GitHub 푸시 보호가 Supabase Secret Key 패턴으로 인식해 푸시를 거부한다(겪었다).
 * 이 테스트가 검증하는 건 "JWT 가 아닌 불투명 문자열" 처리이므로 접두어는 무관하다.
 */
const NEW_FORMAT_KEY = 'opaque-injected-key-not-a-jwt'

describe('bearerTokenOf', () => {
  it('Bearer 토큰을 꺼낸다', () => {
    expect(bearerTokenOf(requestWith('Bearer abc'))).toBe('abc')
  })

  it('헤더가 없으면 null', () => {
    expect(bearerTokenOf(requestWith())).toBeNull()
  })

  it('Bearer 접두어가 없으면 null', () => {
    expect(bearerTokenOf(requestWith('abc'))).toBeNull()
  })

  it('빈 토큰은 null', () => {
    expect(bearerTokenOf(requestWith('Bearer   '))).toBeNull()
  })
})

describe('roleClaimOf', () => {
  it('role 클레임을 읽는다', () => {
    expect(roleClaimOf(jwtWith({ role: 'service_role' }))).toBe('service_role')
    expect(roleClaimOf(jwtWith({ role: 'anon' }))).toBe('anon')
  })

  it('JWT 가 아니면 null — 신규 형식 키는 클레임이 없다', () => {
    expect(roleClaimOf(NEW_FORMAT_KEY)).toBeNull()
  })

  it('깨진 페이로드는 null (던지지 않는다)', () => {
    expect(roleClaimOf('a.!!!.c')).toBeNull()
  })

  it('role 이 없거나 문자열이 아니면 null', () => {
    expect(roleClaimOf(jwtWith({}))).toBeNull()
    expect(roleClaimOf(jwtWith({ role: 1 }))).toBeNull()
  })
})

describe('isServiceRoleCaller', () => {
  it('주입된 키와 같으면 통과 — 신규 형식(JWT 아닌 불투명 키)', () => {
    expect(isServiceRoleCaller(requestWith(`Bearer ${NEW_FORMAT_KEY}`), NEW_FORMAT_KEY)).toBe(true)
  })

  it('레거시 JWT 의 role=service_role 도 통과 — 두 형식이 공존한다', () => {
    const token = jwtWith({ role: 'service_role' })
    expect(isServiceRoleCaller(requestWith(`Bearer ${token}`), NEW_FORMAT_KEY)).toBe(true)
  })

  it('anon JWT 는 막는다 — verify_jwt 만으로는 통과하므로 이 가드가 필요하다', () => {
    const token = jwtWith({ role: 'anon' })
    expect(isServiceRoleCaller(requestWith(`Bearer ${token}`), NEW_FORMAT_KEY)).toBe(false)
  })

  it('인증 헤더가 없으면 막는다', () => {
    expect(isServiceRoleCaller(requestWith(), NEW_FORMAT_KEY)).toBe(false)
  })

  it('길이가 다른 임의 문자열은 막는다', () => {
    expect(isServiceRoleCaller(requestWith('Bearer nope'), NEW_FORMAT_KEY)).toBe(false)
  })
})
