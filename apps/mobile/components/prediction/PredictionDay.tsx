import { Fragment } from 'react'
import { StyleSheet, View } from 'react-native'
import { isHit, isResolved } from '@kbokkang/shared'
import { COLORS, SPACING } from '@/theme/colors'
import { Card } from '@/components/ui/Card'
import { Text } from '@/components/ui/Text'
import { formatDayLabel, formatPoints } from '@/lib/format'
import type { PredictionDayView } from '@/types/prediction'
import { PredictionRow } from './PredictionRow'

/**
 * 하루치 예측 기록 — 날짜 헤더 + 카드 한 장.
 *
 * 날짜별로 묶어 **카드 하나에 그날 예측을 모두** 담고 줄 사이는 얇은 divider 로만
 * 나눈다. 경기마다 카드를 따로 두면 카드가 많아져 목록으로 읽히지 않는다
 * (디자인 가이드 5장 — 같은 덩어리 안은 divider). 카드는 `flush` 이고 좌우 여백은
 * 행이 갖는다 — 그래야 divider 가 카드 폭을 꽉 채운다.
 *
 * ## 요약은 헤더가 갖는다
 *
 * `어제  3경기 1적중  +30P`. 처음엔 획득 포인트를 행마다 우측에 뒀는데 행마다 있는
 * 것과 없는 것이 섞여 **오른쪽 끝이 들쭉날쭉**했다. 하루 합계로 올리면 행은 3열
 * 그리드만 남아 깔끔하고, "어제 얼마 벌었나" 도 한 번에 보인다.
 *
 * 분모는 확정된 예측만 센다(취소·집계중 제외) — 그렇지 않으면 비 온 날 성적이 나빠 보인다.
 */
export interface PredictionDayProps {
  readonly day: PredictionDayView
  readonly now: Date
}

export const PredictionDay = ({ day, now }: PredictionDayProps) => {
  const resolved = day.rows.filter((row) => isResolved(row.result))
  const hits = resolved.filter((row) => isHit(row.result)).length
  const earned = day.rows.reduce((sum, row) => sum + (row.earnedPoints ?? 0), 0)

  return (
    <View style={styles.day}>
      <View style={styles.header}>
        <Text variant="buttonSmall" color="textNormal">
          {formatDayLabel(day.date, now)}
        </Text>

        <View style={styles.summary}>
          {resolved.length > 0 && (
            <Text variant="caption" color="textAlt">
              {resolved.length}경기{' '}
              <Text variant="caption" color={hits > 0 ? 'success' : 'textAlt'}>
                {hits}적중
              </Text>
            </Text>
          )}
          {earned > 0 && (
            <Text variant="buttonSmall" color="success">
              +{formatPoints(earned)}
            </Text>
          )}
        </View>
      </View>

      <Card flush>
        {day.rows.map((row, index) => (
          <Fragment key={row.id}>
            {index > 0 && <View style={styles.divider} />}
            <PredictionRow row={row} />
          </Fragment>
        ))}
      </Card>
    </View>
  )
}

const styles = StyleSheet.create({
  day: { gap: SPACING.sm },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xs,
  },
  summary: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  divider: { height: 1, backgroundColor: COLORS.border },
})
