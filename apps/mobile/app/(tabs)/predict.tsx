import { StyleSheet, View } from 'react-native'
import { Screen } from '@/components/ui/Screen'
import { Text } from '@/components/ui/Text'

/**
 * 예측 — 지난 예측 목록 + 성적(적중률·연승·스코어 적중).
 *
 * 홈은 당일 경기만 보여주므로 **어제 이전 결과를 확인하는 곳이 여기다.**
 * 기획서 3.5(마이)에 있던 성적 항목이 이 탭으로 옮겨왔다.
 *
 * 6-2 다음 순서에서 구현. 지금은 탭 라우팅 확인용 자리표시자다.
 */
const PredictScreen = () => (
  <Screen>
    <View style={styles.center}>
      <Text variant="title2" color="textAlt">
        예측
      </Text>
    </View>
  </Screen>
)

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
})

export default PredictScreen
