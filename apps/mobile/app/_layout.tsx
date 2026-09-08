import { useEffect } from 'react'
import { useFonts } from 'expo-font'
import { Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { QueryClientProvider } from '@tanstack/react-query'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'

import { queryClient } from '@/lib/query-client'
import { COLORS } from '@/theme/colors'
import { FONT_ASSETS } from '@/theme/fonts'

// 폰트가 로드되기 전에 화면이 뜨면 시스템 폰트로 한 번 그려졌다가 바뀐다(깜빡임).
void SplashScreen.preventAutoHideAsync()

const RootLayout = () => {
  const [fontsLoaded, fontError] = useFonts(FONT_ASSETS)

  useEffect(() => {
    // 폰트 로드 실패도 스플래시를 내려야 한다 — 안 그러면 영구 스플래시가 된다.
    if (fontsLoaded || fontError !== null) void SplashScreen.hideAsync()
  }, [fontsLoaded, fontError])

  if (!fontsLoaded && fontError === null) return null

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="dark" />
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
          </Stack>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}

export default RootLayout
