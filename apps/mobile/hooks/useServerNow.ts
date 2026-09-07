import { createContext, useContext, useEffect, useState } from 'react'
import { AppState } from 'react-native'

/**
 * 서버 시각 기준 현재 시각.
 *
 * ⚠️ **예측 마감 판정은 서버 시각 기준이다**(앱기획서 4장). 기기 시계는 사용자가 바꿀 수 있어
 * 그대로 믿으면 마감된 경기에 예측을 넣을 수 있다. 서버와의 오차(offset)를 더해 보정한다.
 *
 * ⚠️ 남은 시간을 모듈 상수나 렌더 밖에서 계산하지 말 것 — 자정을 넘겨 앱을 재개하면
 * 값이 고정된다(플레이북 8번). 이 훅이 주기적으로 갱신하고 앱 복귀 시에도 갱신한다.
 *
 * offset 은 6-4 에서 서버에서 받아 Provider 에 넣는다. 지금은 0(기기 시계 그대로)이지만
 * **화면 코드는 이 훅만 쓰므로 그때 바뀌지 않는다.**
 */
const ServerTimeOffsetContext = createContext(0)

export const ServerTimeOffsetProvider = ServerTimeOffsetContext.Provider

/** 분 단위만 표시하므로 30초면 충분하다. 초를 보여주지 않으니 매초 리렌더는 낭비다. */
const DEFAULT_INTERVAL_MS = 30 * 1000

export const useServerNow = (intervalMs: number = DEFAULT_INTERVAL_MS): Date => {
  const offsetMs = useContext(ServerTimeOffsetContext)
  const [now, setNow] = useState(() => new Date(Date.now() + offsetMs))

  useEffect(() => {
    const tick = (): void => {
      setNow(new Date(Date.now() + offsetMs))
    }

    tick()
    const timer = setInterval(tick, intervalMs)
    // 백그라운드에 있는 동안 타이머가 밀리므로 복귀 즉시 갱신한다
    const subscription = AppState.addEventListener('change', (status) => {
      if (status === 'active') tick()
    })

    return () => {
      clearInterval(timer)
      subscription.remove()
    }
  }, [offsetMs, intervalMs])

  return now
}
