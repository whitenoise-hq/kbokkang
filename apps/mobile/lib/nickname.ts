import { nicknameSchema } from '@kbokkang/shared'

/**
 * 닉네임 **형식** 검증 — 온보딩과 설정이 같은 함수를 쓴다(앱기획서 3.1 / 3.5).
 *
 * 규칙은 `nicknameSchema`(shared)가 갖고, DB 도 같은 제약을 갖는다
 * (`users_nickname_length` / `users_nickname_format`). 규칙이 갈라지면 온보딩은 통과한
 * 닉네임이 설정에서 거부된다.
 *
 * ## 중복 확인은 여기 없다
 *
 * 형식(길이·문자)은 입력할 때마다 즉시, **중복은 저장할 때** `is_nickname_available`
 * RPC 로 확인한다(`hooks/useProfile`) — 한 글자마다 서버를 부르면 낭비다.
 *
 * ⚠️ **확인과 저장 사이에는 경합이 있다.** 확인은 통과했지만 저장 순간 다른 사람이 같은
 *    닉네임을 쓸 수 있다. 그래서 저장은 **unique 위반(23505)도** 처리한다
 *    (`useUpdateProfile`) — 확인만 믿으면 저장이 조용히 실패한다.
 */

/** 형식 검사 결과. 통과하면 `trim` 된 값을 준다 */
export type NicknameCheck =
  | { readonly ok: true; readonly value: string }
  | { readonly ok: false; readonly error: string }

export const checkNicknameFormat = (input: string): NicknameCheck => {
  const parsed = nicknameSchema.safeParse(input)
  if (parsed.success) return { ok: true, value: parsed.data }

  return { ok: false, error: parsed.error.issues[0]?.message ?? '닉네임을 확인해 주세요' }
}

export const NICKNAME_TAKEN_MESSAGE = '이미 사용 중인 닉네임입니다'
