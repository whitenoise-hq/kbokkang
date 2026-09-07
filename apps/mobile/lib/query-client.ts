import { AppState } from 'react-native'
import { focusManager, QueryClient } from '@tanstack/react-query'

/**
 * TanStack Query 설정.
 *
 * ⚠️ RN 에는 window focus 가 없다. `AppState` 를 `focusManager` 에 연결해야
 *    백그라운드에서 돌아올 때 refetch 된다(플레이북 8번).
 *
 * 데이터 신선도 전략:
 * 1. mutation `onSuccess` 에서 `invalidateQueries`
 * 2. 화면 포커스 refetch (`useRefetchOnFocus`)
 * 3. 앱 복귀 refetch (아래 AppState 연결)
 *
 * ⚠️ 쿼리 키에 스코프 id 를 포함할 것(`['predictions', userId]`). 계정 전환 시 캐시가 섞인다.
 * ⚠️ 로그아웃 시 `queryClient.clear()` — 이전 사용자 데이터가 남는다.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
})

AppState.addEventListener('change', (status) => {
  focusManager.setFocused(status === 'active')
})
