'use server'

import { revalidatePath } from 'next/cache'
import { credentialsSchema } from '@kbokkang/shared'
import { createClient } from '@/lib/supabase/server'

export interface AuthResult {
  readonly ok: boolean
  readonly message: string
}

/**
 * 운영자 로그인.
 *
 * 로그인 성공만으로는 부족하다. 일반 유저 계정도 같은 Supabase Auth 를 쓰므로
 * **역할이 admin 인지 서버에서 반드시 확인**하고, 아니면 즉시 로그아웃시킨다.
 * (권한은 app_metadata.role — user_metadata 는 유저가 수정 가능해서 쓸 수 없다)
 */
export const signIn = async (raw: unknown): Promise<AuthResult> => {
  const parsed = credentialsSchema.safeParse(raw)

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues.map((issue) => issue.message).join(', ') }
  }

  try {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.signInWithPassword(parsed.data)

    if (error !== null || data.user === null) {
      // 계정 존재 여부를 노출하지 않도록 한 가지 메시지로 통일한다
      return { ok: false, message: '이메일 또는 비밀번호가 올바르지 않습니다' }
    }

    if (data.user.app_metadata.role !== 'admin') {
      await supabase.auth.signOut()
      return { ok: false, message: '운영자 권한이 없는 계정입니다' }
    }

    revalidatePath('/', 'layout')
    return { ok: true, message: '로그인되었습니다' }
  } catch (error) {
    console.error('로그인 실패:', error)
    return { ok: false, message: '로그인 처리 중 문제가 발생했습니다' }
  }
}

export const signOut = async (): Promise<AuthResult> => {
  try {
    const supabase = await createClient()
    await supabase.auth.signOut()

    revalidatePath('/', 'layout')
    return { ok: true, message: '로그아웃되었습니다' }
  } catch (error) {
    console.error('로그아웃 실패:', error)
    return { ok: false, message: '로그아웃 처리 중 문제가 발생했습니다' }
  }
}
