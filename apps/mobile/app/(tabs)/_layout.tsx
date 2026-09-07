import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { COLORS, SPACING } from '@/theme/colors'
import { FONT_FAMILY } from '@/theme/fonts'

/**
 * 하단 탭 5개 — 홈 / 예측 / 뽑기 / 도감 / 마이. **다섯 개가 모두 동일한 형태다.**
 *
 * 기획서 3장은 탭 4개였다. 예측 기록·성적을 별도 탭으로 분리했다:
 * - **홈은 당일 경기만** 보여준다("한 화면 한 핵심 행동"). 어제 결과 카드를 섞으면 초점이 흐려진다.
 * - **예측 탭**이 지난 예측 목록 + 성적(적중률·연승)을 갖는다.
 *   그래서 마이는 프로필·포인트·설정에 집중한다(기획서 3.5 의 성적 항목이 여기로 옮겨왔다).
 *
 * ## 중앙 강조 버튼은 시도했다가 버렸다
 *
 * 뽑기 탭을 원형 파란 버튼으로 키워 올려봤는데 **혼자 튀어나와 열이 맞지 않았다.**
 * 라벨을 지워도 다른 탭과 baseline·시각 무게가 어긋났다. 그래서 다섯 탭을 동일하게 둔다.
 *
 * 디자인 가이드 7.1 의 "뽑기만 화려하다"는 **뽑기 화면**에 대한 것이고 탭 바가 아니다.
 * 탭 바는 내비게이션 크롬이므로 절제한다 — 다시 강조를 넣지 말 것.
 *
 * ⚠️ 탭 라벨에 `fontWeight` 를 주면 안 된다 — 커스텀 폰트는 굵기별 패밀리가 따로
 *    등록되므로 `fontFamily` 로만 지정한다(안 그러면 시스템 폰트로 폴백).
 *
 * ⚠️ 탭은 전환해도 unmount 되지 않는다. 재진입 시 갱신이 필요하면 `useFocusEffect` 를 쓴다.
 */

/**
 * 탭 바 콘텐츠 높이(홈 인디케이터 인셋 제외).
 * iOS 기본값 49 는 아이콘이 상단 테두리에 붙어 답답해서 늘렸다.
 */
const BAR_CONTENT_HEIGHT = 60

const TabsLayout = () => {
  // ⚠️ 높이를 직접 지정하면 **하단 인셋 처리도 직접 해야 한다.** 기본값은 React Navigation 이
  //    알아서 더해주지만 height 를 덮어쓰면 그게 사라져 홈 인디케이터와 겹친다.
  const insets = useSafeAreaInsets()

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textAlt,
        tabBarStyle: {
          backgroundColor: COLORS.background,
          height: BAR_CONTENT_HEIGHT + insets.bottom,
          paddingTop: SPACING.sm,
          paddingBottom: insets.bottom,
          // 기본 hairline 테두리로는 경계가 보이지 않는다. 1px + `borderStrong`(진한 구분선)
          // 으로 명시하고 **위쪽으로** 은은한 그림자를 얹어 층을 만든다.
          borderTopWidth: 1,
          borderTopColor: COLORS.borderStrong,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
        },
        tabBarLabelStyle: {
          fontFamily: FONT_FAMILY.semibold,
          fontSize: 11,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '홈',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'baseball' : 'baseball-outline'} size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="predict"
        options={{
          title: '예측',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'stats-chart' : 'stats-chart-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="draw"
        options={{
          title: '뽑기',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'sparkles' : 'sparkles-outline'} size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="dex"
        options={{
          title: '도감',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'albums' : 'albums-outline'} size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="my"
        options={{
          title: '마이',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  )
}

export default TabsLayout
