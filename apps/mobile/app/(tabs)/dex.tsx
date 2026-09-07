import { StyleSheet, View } from 'react-native'
import { Screen } from '@/components/ui/Screen'
import { Text } from '@/components/ui/Text'

/** 도감 — 6-2 에서 구현. 지금은 탭 라우팅 확인용 자리표시자다. */
const DexScreen = () => (
  <Screen>
    <View style={styles.center}>
      <Text variant="title2" color="textAlt">
        도감
      </Text>
    </View>
  </Screen>
)

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
})

export default DexScreen
