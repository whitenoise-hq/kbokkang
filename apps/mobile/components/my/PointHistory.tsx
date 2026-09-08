import { Fragment } from 'react'
import { StyleSheet, View } from 'react-native'
import { POINT_REASON_LABEL } from '@kbokkang/shared'
import { COLORS, SPACING } from '@/theme/colors'
import { Card } from '@/components/ui/Card'
import { Text } from '@/components/ui/Text'
import { formatDateWithWeekday, formatPoints } from '@/lib/format'
import type { PointEntryView } from '@/types/profile'

/**
 * 포인트 내역 — 획득/사용 목록(앱기획서 3.5).
 *
 * 사유는 `POINT_REASON_LABEL`(shared)을 쓴다 — 어드민의 유저 상세와 같은 문구여야
 * 운영자와 유저가 같은 내역을 본다.
 *
 * ## 차감을 빨강으로 쓰지 않는다
 *
 * 디자인 가이드 1장은 `danger` 를 "포인트 차감"에도 배정했지만 여기서는 `textNormal` 을
 * 쓴다. 뽑기로 100P 를 쓰는 것은 **실패가 아니라 정상 행동**이고, 내역을 열 때마다
 * 빨간 줄이 가득하면 잘못한 것처럼 보인다. 구분은 **부호**(`+` / `−`)가 한다.
 * 획득만 `success` 로 강조한다.
 *
 * 카드 하나에 줄을 담고 divider 로 나눈다 — 줄마다 카드를 두면 목록으로 읽히지 않는다.
 */
export interface PointHistoryProps {
  readonly entries: readonly PointEntryView[]
}

export const PointHistory = ({ entries }: PointHistoryProps) => {
  if (entries.length === 0) {
    return (
      <Card>
        <Text variant="body2" color="textAlt" align="center">
          포인트 내역이 없습니다
        </Text>
      </Card>
    )
  }

  return (
    <Card>
      {entries.map((entry, index) => (
        <Fragment key={entry.id}>
          {index > 0 && <View style={styles.divider} />}
          <View style={styles.row}>
            <View style={styles.main}>
              <Text variant="body1">{POINT_REASON_LABEL[entry.reason]}</Text>
              <Text variant="caption" color="textAlt">
                {formatDateWithWeekday(entry.createdAt)}
              </Text>
            </View>

            <Text
              variant="button"
              color={entry.amount > 0 ? 'success' : 'textNormal'}
              style={styles.amount}
            >
              {/* 마이너스 기호는 하이픈이 아니라 U+2212 — 하이픈은 숫자 옆에서 너무 짧다 */}
              {entry.amount > 0 ? '+' : '−'}
              {formatPoints(Math.abs(entry.amount))}
            </Text>
          </View>
        </Fragment>
      ))}
    </Card>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.md,
    paddingVertical: SPACING.sm + 2,
  },
  main: { gap: 1, flexShrink: 1 },
  amount: { fontVariant: ['tabular-nums'] },
  divider: { height: 1, backgroundColor: COLORS.border },
})
