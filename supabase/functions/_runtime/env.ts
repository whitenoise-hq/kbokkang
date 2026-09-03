/**
 * Edge Function 환경변수.
 *
 * Supabase 가 `SUPABASE_URL` 과 `SUPABASE_SERVICE_ROLE_KEY` 를 자동 주입한다 —
 * 별도로 등록할 시크릿이 없다(GitHub Actions 보다 관리할 게 적다).
 *
 * ⚠️ **`_runtime` 은 Deno 전용이다.** `Deno` 전역을 쓰는 파일은 여기에만 둔다 —
 * `_shared` 는 Node(로컬 CLI·테스트)에서도 타입체크·실행되므로 `Deno` 를 참조하면 깨진다.
 * `_shared` 는 설정을 전부 인자로 받는다.
 */
export interface FunctionEnv {
  readonly supabaseUrl: string
  readonly serviceRoleKey: string
}

export const functionEnv = (): FunctionEnv => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (supabaseUrl === undefined || supabaseUrl === '') {
    throw new Error('SUPABASE_URL 이 없습니다')
  }
  if (serviceRoleKey === undefined || serviceRoleKey === '') {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY 가 없습니다')
  }

  return { supabaseUrl, serviceRoleKey }
}
