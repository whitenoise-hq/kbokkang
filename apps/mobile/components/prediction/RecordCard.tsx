import { StyleSheet, View } from 'react-native'
import { hitRate } from '@kbokkang/shared'
import { COLORS, RADIUS, SPACING } from '@/theme/colors'
import { Card } from '@/components/ui/Card'
import { Text } from '@/components/ui/Text'
import { formatPoints } from '@/lib/format'
import type { PredictionRecordView } from '@/types/prediction'

/**
 * 예측 성적 요약 — 예측 탭 상단.
 *
 * 기획서 3.5(마이)에 있던 성적 항목이 이 탭으로 옮겨왔다. 지난 예측 목록과 함께 봐야
 * 의미가 있고, 마이는 계정·포인트·설정에 집중한다(앱기획서 3장).
 *
 * ## 적중률이 주인공이다
 *
 * 적중률만 `display`(32) 로 크게 쓰고 나머지는 아래 회색 블록에 작게 모은다.
 * 넷을 같은 크기로 나열하면 무엇을 봐야 하는지 알 수 없다.
 *
 * ⚠️ **여기를 세 칸 한 줄로 평탄화하지 말 것.** 적중률·최고 연승·획득 포인트를 같은
 *    크기로 늘어놓아 봤지만 요약의 위계가 사라져 되돌렸다. 진행 바를 넣는 것도
 *    마찬가지로 층이 한 겹 더 생겨서 버렸다.
 *
 * **확정된 예측이 없으면 `–` 다.** 0% 로 보여주면 신규 유저에게 실패한 것처럼 읽힌다
 * (`hitRate` 가 null 을 돌려주는 이유).
 *
 * ⚠️ **연승 값의 단위는 "일"이다** — 하루 단위 전승 연속이기 때문이다(`bestStreak` 주석).
 *    `3연승` 으로 쓰면 3경기로 읽히므로 `3일` 로 쓴다.
 *
 * ## 강조는 배경색 한 겹으로만
 *
 * 카드 배경을 옅은 파랑(`primaryLight`)으로 두고 **안쪽 통계 블록을 흰색으로 반전**한다.
 * 회색 화면 위에서 이 카드만 떠 보이면서도 진하지 않다.
 *
 * ⚠️ **흰 카드 안에 파란 블록을 또 넣지 말 것.** 그러면 카드 안에 파란 블록 + 회색
 *    블록으로 층이 두 겹이 되어, 앞서 걷어낸 "층이 많다" 문제로 되돌아간다.
 *
 * 테두리를 쓰지 않는다(디자인 가이드 5장) — 카드와 통계 블록 모두 **배경 계층**으로만
 * 구분한다.
 *
 * 파란 배경 위에서는 부연을 `textAlt` 가 아니라 `textNormal` 로 쓴다 — 옅은 파랑과
 * 대비가 모자라 12px 글자가 흐려 보인다.
 */
export interface RecordCardProps {
  readonly record: PredictionRecordView
}

export const RecordCard = ({ record }: RecordCardProps) => {
  const rate = hitRate(record.hits, record.resolvedPredictions)

  return (
    <Card style={styles.card}>
      <Text variant="body2" color="textNormal">
        적중률
      </Text>
      <Text variant="display" style={styles.rate} color="primary">
        {rate === null ? '–' : `${String(Math.round(rate * 100))}%`}
      </Text>
      <Text variant="caption" color="textNormal">
        {record.resolvedPredictions === 0
          ? '아직 결과가 나온 예측이 없습니다'
          : `확정 ${record.resolvedPredictions}경기 중 ${record.hits}경기 적중`}
      </Text>

      <View style={styles.stats}>
        <Stat label="현재 연승" value={`${String(record.currentStreak)}일`} />
        <Stat label="최고 연승" value={`${String(record.bestStreak)}일`} />
        <Stat label="획득 포인트" value={formatPoints(record.earnedPoints)} />
      </View>
    </Card>
  )
}

interface StatProps {
  readonly label: string
  readonly value: string
}

const Stat = ({ label, value }: StatProps) => (
  <View style={styles.stat}>
    <Text variant="caption" color="textAlt">
      {label}
    </Text>
    <Text variant="button" style={styles.statValue}>
      {value}
    </Text>
  </View>
)

const styles = StyleSheet.create({
  card: { backgroundColor: COLORS.primaryLight },
  // 큰 숫자는 기본 lineHeight 가 위아래로 벌어져서 조여 준다
  rate: { fontVariant: ['tabular-nums'], marginTop: SPACING.xs, marginBottom: SPACING.xs },
  // 파란 카드 안에서 흰색으로 반전 — 층을 늘리지 않고 구분한다
  stats: {
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm + 4,
    marginTop: SPACING.md,
  },
  stat: { flex: 1, alignItems: 'center', gap: SPACING.xs },
  statValue: { fontVariant: ['tabular-nums'] },
})
