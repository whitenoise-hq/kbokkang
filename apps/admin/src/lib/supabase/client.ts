import { createBrowserClient } from '@supabase/ssr'
import { publicEnv } from '@/lib/env'

/**
 * 브라우저(클라이언트 컴포넌트)용 Supabase 클라이언트.
 * anon key + RLS 기반이므로 여기서 권한 검사를 신뢰하지 말 것.
 */
export const createClient = () => {
  const { NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY } = publicEnv()

  return createBrowserClient(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)
}
