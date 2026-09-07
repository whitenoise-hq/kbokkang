import { StyleSheet, View } from 'react-native'
import { Screen } from '@/components/ui/Screen'
import { Text } from '@/components/ui/Text'
import { SPACING } from '@/theme/colors'

/**
 * 임시 진입 화면 — 6-1 골격 확인용.
 *
 * 6-2 에서 실제 화면(온보딩·홈·예측·뽑기·도감·설정)으로 교체한다.
 */
const HomeScreen = () => (
  <Screen>
    <View style={styles.center}>
      <Text variant="title1">크보깡</Text>
      <Text variant="body2" color="textAlt">
        골격 세팅 완료
      </Text>
    </View>
  </Screen>
)

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: SPACING.sm },
})

export default HomeScreen
