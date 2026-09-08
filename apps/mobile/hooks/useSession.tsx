import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { Session } from '@supabase/supabase-js'

import { supabase } from '@/lib/supabase'

/**
 * 로그인 세션.
 *
 * ## TanStack Query 를 쓰지 않는다
 *
 * 세션은 **서버에서 가져오는 데이터가 아니라 앱의 상태**다. Supabase 가 토큰 갱신·저장을
 * 이미 맡고 있고(`persistSession` + AsyncStorage), 변경은 `onAuthStateChange` 로 밀려 온다.
 * 쿼리로 감싸면 캐시 무효화 시점을 우리가 다시 관리해야 하고 실제 상태와 어긋난다.
 *
 * 대신 **화면은 `supabase.auth` 를 직접 부르지 않는다** — 여기를 통한다(플레이북의
 * "클라이언트 직접 호출 금지" 와 같은 취지다).
 *
 * ## 로그아웃 때 쿼리 캐시를 비운다
 *
 * ⚠️ 비우지 않으면 **다른 계정으로 로그인했을 때 이전 유저의 포인트·도감이 잠깐 보인다.**
 *    캐시 키에 유저 id 를 넣어도 화면이 먼저 그려지는 순간이 있다.
 *
 * ## 초기 판정 중에는 `loading` 이다
 *
 * 저장된 세션을 읽는 동안(`getSession`) 로그인 여부를 알 수 없다. 이때 로그인 화면을
 * 그리면 **이미 로그인한 유저에게 로그인 화면이 한 번 번쩍인다.** 그래서 `loading` 을
 * 두고 스플래시를 유지한다(`app/_layout.tsx`).
 */
export interface SessionState {
  readonly session: Session | null
  /** 저장된 세션을 아직 확인하는 중 */
  readonly loading: boolean
}

const SessionContext = createContext<SessionState>({ session: null, loading: true })

export const SessionProvider = ({ children }: { readonly children: ReactNode }) => {
  const queryClient = useQueryClient()
  const [state, setState] = useState<SessionState>({ session: null, loading: true })

  useEffect(() => {
    let active = true

    void supabase.auth.getSession().then(({ data }) => {
      if (active) setState({ session: data.session, loading: false })
    })

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return

      // 계정이 바뀌면 이전 유저의 데이터가 화면에 남지 않게 캐시를 비운다
      if (event === 'SIGNED_OUT') queryClient.clear()

      setState({ session, loading: false })
    })

    return () => {
      active = false
      data.subscription.unsubscribe()
    }
  }, [queryClient])

  return <SessionContext.Provider value={state}>{children}</SessionContext.Provider>
}

export const useSession = (): SessionState => useContext(SessionContext)

/** 로그인한 유저 id. 로그인 전에는 null */
export const useUserId = (): string | null => useSession().session?.user.id ?? null

/** 로그인·로그아웃 호출은 `lib/auth` 에 모여 있다. 화면 편의를 위해 재노출한다 */
export { signOut } from '@/lib/auth'
