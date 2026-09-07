import { Pressable, StyleSheet, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { COLORS, PRESS_SCALE, RADIUS, SPACING } from '@/theme/colors'
import { Text } from '@/components/ui/Text'
import { shadowStyle } from '@/theme/shadow'
import { formatPoints } from '@/lib/format'

/**
 * 어제 결과 요약 — 홈 상단. 토스트(알림) 형태.
 *
 * 홈은 당일 경기만 보여주지만, **예측 앱을 여는 가장 큰 동기가 "내가 맞췄나?"** 다.
 * 그걸 예측 탭에만 두면 확인 경로가 한 단계 늘어난다. 카드 목록은 섞지 않고
 * **한 줄만** 둬서 초점을 유지하면서 확인 동기를 만족시킨다.
 *
 * ## 스타일 (시도하며 정해진 것)
 *
 * - **배경을 강조색으로 꽉 채우지 않는다.** `success` 로 가득 채웠더니 너무 진했다.
 *   옅은 초록(`successLight`) 틴트만 쓴다.
 * - **테두리를 두지 않는다**(디자인 가이드 5장). 강조색 테두리를 둘러봤지만 선이 진해
 *   배너가 버튼처럼 보였다. 구분은 배경색과 그림자가 한다.
 * - **글씨는 `body2` 한 줄.** 제목/설명 2줄로 만들었더니 글씨가 커지고 배너가 두꺼워졌다.
 * - 앞 아이콘은 적중 여부와 무관하게 **예측 탭과 같은 `stats-chart`** 다 —
 *   이 배너가 어디로 가는지 아이콘만으로 알 수 있어야 한다. 상태는 **톤(색)**으로 구분한다.
 * - 우측은 닫기(X)가 아니라 **화살표**다. 사라지는 알림이 아니라 예측 탭으로 가는 링크다.
 * - **적중이 없으면 흰 배경**(카드처럼). 실패를 빨강으로 강조하면 앱을 열 때마다 기분이
 *   나빠진다. 회색 틴트도 써봤지만 **화면 배경(`surface`)과 겹쳐 존재감이 없었다.**
 *
 * 어제 예측이 없으면 렌더하지 않는다 — 빈 배너는 소음이다.
 */
export interface YesterdaySummary {
  /** 어제 예측한 경기 수 */
  readonly predicted: number
  /** 그중 적중한 수 */
  readonly hits: number
  readonly earnedPoints: number
}

export interface YesterdayBannerProps {
  readonly summary: YesterdaySummary
  readonly onPress: () => void
}

export const YesterdayBanner = ({ summary, onPress }: YesterdayBannerProps) => {
  const hasHit = summary.hits > 0

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`어제 ${String(summary.predicted)}경기 중 ${String(summary.hits)}경기 적중. 예측 기록 보기`}
      style={({ pressed }) => [
        styles.banner,
        hasHit ? styles.hit : styles.neutral,
        pressed ? styles.pressed : null,
      ]}
    >
      <View style={styles.content}>
        <Ionicons name="stats-chart" size={15} color={hasHit ? COLORS.success : COLORS.textAlt} />

        <Text variant="body2" color="textNormal">
          어제 {summary.predicted}경기 중{' '}
          <Text variant="body2" color={hasHit ? 'success' : 'textNormal'}>
            {summary.hits}경기 적중
          </Text>
        </Text>

        {summary.earnedPoints > 0 && (
          <Text variant="body2" color="success">
            +{formatPoints(summary.earnedPoints)}
          </Text>
        )}
      </View>

      <Ionicons name="chevron-forward" size={16} color={COLORS.textAlt} />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md - 2,
    paddingVertical: SPACING.sm + 2,
    ...shadowStyle('card'),
  },
  hit: { backgroundColor: COLORS.successLight },
  neutral: { backgroundColor: COLORS.background },
  content: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, flexShrink: 1 },
  pressed: { transform: [{ scale: PRESS_SCALE }] },
})
