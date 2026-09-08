import { StyleSheet, View } from 'react-native'
import { COLORS, RADIUS, SPACING } from '@/theme/colors'
import { Card } from '@/components/ui/Card'
import { Text } from '@/components/ui/Text'

/**
 * 수집률 요약 — 도감 상단.
 *
 * 예측 탭의 성적 카드와 **같은 강조 방식**이다(옅은 파랑 배경 + 안쪽은 흰색).
 * 두 탭의 요약 카드가 같은 모양이어야 "이건 요약"으로 읽힌다(디자인 가이드 6장 강조 카드).
 *
 * **등급별 진행률은 여기 두지 않는다.** 필터 칩에 숫자를 넣어(`일반 8/30`) 필터와
 * 진행률을 한 몸으로 만들었다 — 카드에 5칸을 또 두면 층이 늘고, 유저는 등급을 고를 때
 * 어차피 칩을 본다.
 *
 * 진행률 바는 남겨 뒀다. "수집"은 채워 가는 활동이라 **얼마나 남았는지**가 숫자보다
 * 바로 읽힌다(가이드 8장 도감 힌트).
 */
export interface DexProgressCardProps {
  readonly owned: number
  readonly total: number
}

const BAR_HEIGHT = 6

export const DexProgressCard = ({ owned, total }: DexProgressCardProps) => {
  const ratio = total === 0 ? 0 : owned / total

  return (
    <Card style={styles.card}>
      <View style={styles.head}>
        <Text variant="body2" color="textNormal">
          수집률
        </Text>
        <Text variant="buttonSmall" color="primary" style={styles.tabular}>
          {total === 0 ? '–' : `${String(Math.round(ratio * 100))}%`}
        </Text>
      </View>

      <Text variant="title1" color="primary" style={styles.tabular}>
        {owned} / {total}
      </Text>

      <View style={styles.track}>
        {ratio > 0 && <View style={[styles.fill, { flex: ratio }]} />}
        <View style={{ flex: 1 - ratio }} />
      </View>
    </Card>
  )
}

const styles = StyleSheet.create({
  card: { backgroundColor: COLORS.primaryLight, gap: SPACING.xs },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tabular: { fontVariant: ['tabular-nums'] },
  /**
   * 채움 폭을 `flex` 로 나눈다 — 퍼센트 문자열(`width: '27%'`)은 타입이 까다롭고
   * 소수점에서 어긋난다. 트랙이 `row` 라 두 자식의 flex 비율이 그대로 폭이 된다.
   */
  track: {
    flexDirection: 'row',
    height: BAR_HEIGHT,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.background,
    overflow: 'hidden',
    marginTop: SPACING.sm,
  },
  fill: { backgroundColor: COLORS.primary },
})
