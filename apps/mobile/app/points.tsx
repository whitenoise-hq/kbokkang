import { useMemo } from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'
import { SCREEN_PADDING, SECTION_GAP, SPACING } from '@/theme/colors'
import { Screen } from '@/components/ui/Screen'
import { ScreenHeader } from '@/components/ui/ScreenHeader'
import { Text } from '@/components/ui/Text'
import { PointHistory } from '@/components/my/PointHistory'
import { formatPoints } from '@/lib/format'
import { mockPointHistory, mockProfile } from '@/mocks/profile'

/**
 * 포인트 내역 — 마이에서 들어온다(앱기획서 3.5).
 *
 * 마이 화면에 내역을 **펼쳐 두지 않는다.** 내역은 길어질수록 화면 대부분을 차지하는데,
 * 마이에 온 유저가 매번 보고 싶은 것은 아니다. 마이는 "지금 얼마 있나"(잔액)까지만
 * 보여주고 **내역은 메뉴 한 줄**로 넘긴다.
 *
 * 잔액을 여기서도 한 번 더 쓴다 — 내역을 보는 맥락은 "왜 이 잔액이 됐나" 이므로
 * 기준값이 같은 화면에 있어야 계산이 따라온다.
 *
 * ⚠️ 지금은 목업이다. 6-4 에서 `point_transactions` 조회로 바꾸고 **무한 스크롤**을
 *    붙인다 — 내역은 계속 쌓이므로 한 번에 다 그릴 수 없다.
 */
const PointsScreen = () => {
  const profile = useMemo(mockProfile, [])
  const history = useMemo(mockPointHistory, [])

  return (
    <Screen flush>
      <ScreenHeader title="포인트 내역" />

      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.balance}>
          <Text variant="body2" color="textAlt">
            보유 포인트
          </Text>
          <Text variant="display" style={styles.value}>
            {formatPoints(profile.points)}
          </Text>
        </View>

        <PointHistory entries={history} />
      </ScrollView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  body: {
    paddingHorizontal: SCREEN_PADDING,
    paddingTop: SPACING.sm,
    paddingBottom: SECTION_GAP,
    gap: SECTION_GAP,
  },
  balance: { gap: SPACING.xs },
  value: { fontVariant: ['tabular-nums'] },
})

export default PointsScreen
