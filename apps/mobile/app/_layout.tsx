import { useEffect } from 'react'
import { useFonts } from 'expo-font'
import { Stack, router, useSegments } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { QueryClientProvider } from '@tanstack/react-query'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'

import { queryClient } from '@/lib/query-client'
import { SessionProvider, useSession } from '@/hooks/useSession'
import { useMyProfile } from '@/hooks/useProfile'
import { COLORS } from '@/theme/colors'
import { FONT_ASSETS } from '@/theme/fonts'

// 폰트가 로드되기 전에 화면이 뜨면 시스템 폰트로 한 번 그려졌다가 바뀐다(깜빡임).
void SplashScreen.preventAutoHideAsync()

/** 이 시간이 지나면 판정을 못 끝냈더라도 스플래시를 내린다 */
const SPLASH_TIMEOUT_MS = 4000

const RootLayout = () => {
  const [fontsLoaded, fontError] = useFonts(FONT_ASSETS)

  if (!fontsLoaded && fontError === null) return null

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          {/* 세션 훅이 로그아웃 시 쿼리 캐시를 비우므로 QueryClientProvider 안에 있어야 한다 */}
          <SessionProvider>
            <StatusBar style="dark" />
            <AuthGate />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: COLORS.surface },
              }}
            >
              <Stack.Screen name="(tabs)" />
              {/*
                ⚠️ 화면 옵션을 **여기서** 선언한다. 화면 컴포넌트 안에서
                `<Stack.Screen options={{ presentation: ... }} />` 로 주면 리렌더마다
                옵션이 다시 적용돼 **화면이 재마운트**되고 `useState` 가 날아간다
                (개봉 화면에서 장수를 골라도 처음 상태로 되돌아갔다).
              */}
              <Stack.Screen
                name="pack/[type]"
                options={{
                  // 탭 바를 가리고 전체화면으로 — 개봉 연출에 집중시킨다(가이드 7.1)
                  presentation: 'fullScreenModal',
                  animation: 'slide_from_bottom',
                  contentStyle: { backgroundColor: COLORS.drawStage },
                }}
              />
              {/* 로그인·온보딩은 되돌아갈 곳이 없다 — 제스처로 빠져나가지 못하게 막는다 */}
              <Stack.Screen name="login" options={{ gestureEnabled: false }} />
              <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
            </Stack>
          </SessionProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}

/**
 * 로그인·온보딩 관문.
 *
 * | 상태 | 보내는 곳 |
 * |---|---|
 * | 세션 없음 | `/login` |
 * | 세션 있고 `nickname is null` | `/onboarding` |
 * | 세션 있고 닉네임 있음 | 탭(로그인·온보딩에 있었다면 홈으로) |
 *
 * 닉네임으로 판정하는 이유: OAuth 는 가입 폼이 없어 닉네임을 물어볼 화면이 없다.
 * 그래서 가입 트리거가 `nickname is null` 인 행을 만들고 **앱이 그걸 보고** 온보딩을
 * 띄운다(앱기획서 3.1).
 *
 * ## 화면을 그리지 않는 컴포넌트다
 *
 * `<Stack>` 형제로 두고 `useEffect` 에서 `router.replace` 만 한다. `<Redirect>` 로
 * 감싸려면 레이아웃이 라우트 트리를 조건부로 바꿔야 하는데, 그러면 **탭 상태가
 * 매번 초기화**된다.
 *
 * ⚠️ **판정이 끝날 때까지 스플래시를 유지한다.** 세션을 읽는 동안(`loading`) 또는
 *    프로필을 불러오는 동안 화면을 그리면 **로그인·온보딩 화면이 한 번 번쩍인다.**
 *
 * ⚠️ 프로필 조회가 실패하면(네트워크 등) 온보딩으로 보내지 않는다 — 닉네임이 있는
 *    유저를 온보딩에 가둬 버린다. 실패는 화면들이 각자 처리하게 두고 관문은 통과시킨다.
 */
const AuthGate = () => {
  const { session, loading } = useSession()
  const profile = useMyProfile()
  const segments = useSegments()

  const signedIn = session !== null
  // 세션이 있으면 프로필 판정까지 기다린다. 실패(`isError`)는 기다리지 않는다.
  const settled = !loading && (!signedIn || profile.isSuccess || profile.isError)

  useEffect(() => {
    if (!settled) return
    void SplashScreen.hideAsync()
  }, [settled])

  /**
   * 안전망 — 판정이 어떤 이유로든 끝나지 않아도 스플래시를 내린다.
   *
   * ⚠️ 스플래시가 안 내려가면 화면이 **완전히 비어** 보인다. 원인을 찾기도 어렵다
   *    (로그를 봐야 안다). 세션 조회가 매달리거나 예외가 나도 최소한 화면은 뜨게 한다.
   */
  useEffect(() => {
    const timer = setTimeout(() => {
      void SplashScreen.hideAsync()
    }, SPLASH_TIMEOUT_MS)

    return () => {
      clearTimeout(timer)
    }
  }, [])

  useEffect(() => {
    if (!settled) return

    const root = segments[0]
    const onLogin = root === 'login'
    const onOnboarding = root === 'onboarding'
    const needsOnboarding = profile.isSuccess && profile.data.nickname === null

    if (!signedIn) {
      if (!onLogin) router.replace('/login')
      return
    }

    if (needsOnboarding) {
      if (!onOnboarding) router.replace('/onboarding')
      return
    }

    if (onLogin || onOnboarding) router.replace('/')
  }, [settled, signedIn, profile.isSuccess, profile.data?.nickname, segments])

  return null
}

export default RootLayout
