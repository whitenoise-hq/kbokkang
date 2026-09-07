import { useMemo } from 'react'
import { FlatList, StyleSheet, View } from 'react-native'
import { Screen } from '@/components/ui/Screen'
import { Text } from '@/components/ui/Text'
import { PredictionDay } from '@/components/prediction/PredictionDay'
import { RecordCard } from '@/components/prediction/RecordCard'
import { useServerNow } from '@/hooks/useServerNow'
import { mockPredictionDays, mockPredictionRecord } from '@/mocks/predictions'
import { SECTION_GAP, SCREEN_PADDING, SPACING } from '@/theme/colors'

/**
 * 예측 — 지난 예측 기록 + 성적(앱기획서 3장 탭 2).
 *
 * 홈은 당일 경기만 보여주므로 **어제 이전 결과를 확인하는 곳이 여기다.** 홈 상단의
 * 어제 결과 배너를 탭하면 이 화면으로 온다.
 *
 * ## 내가 예측한 경기만 보여준다
 *
 * 예측하지 않은 경기는 나오지 않는다. 이 화면은 **경기 일정표가 아니라 내 기록**이다 —
 * 안 고른 경기까지 나열하면 "안 한 것"이 목록의 대부분을 차지해 기록이 묻힌다.
 * 그래서 목록의 단위도 경기가 아니라 `predictions` 한 줄이다(`PredictionRowView`).
 *
 * ## 날짜별로 묶는다
 *
 * 날짜 헤더 + 그날 예측을 담은 카드 한 장. 헤더 우측에 그날 적중 수를 둔다.
 * 어제는 날짜 대신 **"어제"** 로 쓴다(`formatDayLabel`).
 *
 * ⚠️ 지금은 목업이다. 6-4 에서 TanStack Query 훅으로 교체하고 `mocks/predictions.ts` 를
 *    지운다. 그때 **무한 스크롤**(날짜 단위 페이지네이션)을 붙인다 — 지금은 데이터가
 *    적어 `FlatList` 한 번에 그린다.
 */
const PredictScreen = () => {
  const now = useServerNow()
  const days = useMemo(mockPredictionDays, [])
  const record = useMemo(() => mockPredictionRecord(days), [days])

  return (
    <Screen flush>
      <FlatList
        data={days}
        keyExtractor={(day) => day.date}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text variant="title1">내 예측</Text>
            <RecordCard record={record} />
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text variant="body1" color="textAlt" align="center">
              아직 예측한 경기가 없습니다
            </Text>
            <Text variant="caption" color="textAlt" align="center">
              홈에서 오늘 경기를 예측해 보세요
            </Text>
          </View>
        }
        renderItem={({ item }) => <PredictionDay day={item} now={now} />}
      />
    </Screen>
  )
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: SCREEN_PADDING, paddingBottom: SECTION_GAP },
  header: { gap: SPACING.md, paddingTop: SPACING.sm, paddingBottom: SECTION_GAP },
  separator: { height: SECTION_GAP - SPACING.sm },
  empty: { gap: SPACING.sm, paddingVertical: SECTION_GAP * 2 },
})

export default PredictScreen
