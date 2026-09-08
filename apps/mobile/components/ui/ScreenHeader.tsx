import { Pressable, StyleSheet, View } from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { COLORS, SPACING } from '@/theme/colors'
import { Text } from './Text'

/**
 * 뒤로가기 + 제목 헤더 — 탭 밖의 하위 화면들이 쓴다.
 *
 * 전역 `Stack` 이 `headerShown: false` 다(`app/_layout.tsx`) — 네이티브 헤더는 폰트·색을
 * 따로 설정해야 하고 우리 토큰과 어긋난다. 그래서 화면이 직접 헤더를 둔다.
 *
 * ⚠️ **라우트 파일에서 이 컴포넌트를 정의하지 말 것.** expo-router 는 라우트 파일의
 *    export 를 특별하게 다루므로(default·`ErrorBoundary`·`unstable_settings`) 화면끼리
 *    컴포넌트를 주고받으면 안 된다. 공용은 여기 둔다.
 */
export interface ScreenHeaderProps {
  /** 없으면 뒤로가기만 둔다(카드 상세처럼 내용이 제목을 대신하는 화면) */
  readonly title?: string
}

export const ScreenHeader = ({ title }: ScreenHeaderProps) => (
  <View style={styles.header}>
    <Pressable
      onPress={() => {
        router.back()
      }}
      accessibilityRole="button"
      accessibilityLabel="뒤로"
      hitSlop={12}
    >
      <Ionicons name="chevron-back" size={26} color={COLORS.textStrong} />
    </Pressable>
    {title !== undefined && <Text variant="button">{title}</Text>}
  </View>
)

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: SPACING.sm,
  },
})
