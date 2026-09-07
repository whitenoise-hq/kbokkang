import 'react-native-url-polyfill/auto'

import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@kbokkang/shared'

import { env } from './env'

/**
 * Supabase 클라이언트 (앱 = anon key).
 *
 * ⚠️ **`<Database>` 제네릭을 빼면 모든 쿼리 결과가 `any` 가 된다.** 어드민에서 실제로
 *    겪었다 — 타입을 생성해두고 제네릭을 안 붙여서 컬럼명 오타도 통과했다.
 *
 * ⚠️ 화면·컴포넌트에서 이 클라이언트를 **직접 부르지 않는다.** `hooks/` 의 TanStack Query
 *    훅으로만 접근한다(플레이북). 캐시 무효화·로딩 상태가 한 곳에 모여야 한다.
 *
 * 앱은 anon key 로 붙으므로 **RLS 가 유일한 방어선**이다.
 */
export const supabase = createClient<Database>(env.supabaseUrl, env.supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    // RN 에는 URL 세션이 없다. 켜두면 OAuth 복귀 처리와 충돌한다.
    detectSessionInUrl: false,
  },
})
