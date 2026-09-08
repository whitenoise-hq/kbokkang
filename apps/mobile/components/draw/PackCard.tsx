import { Pressable, StyleSheet, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { DRAW_COST_SINGLE, DRAW_TYPE_LABEL, type DrawType } from '@kbokkang/shared'
import { COLORS, RADIUS, SPACING } from '@/theme/colors'
import { shadowStyle } from '@/theme/shadow'
import { Text } from '@/components/ui/Text'
import { formatPoints } from '@/lib/format'
import { PackImage } from './PackImage'

/**
 * 팩 한 장 — 뽑기 탭에서 고르는 대상.
 *
 * **일반·프리미엄을 나란히** 놓는다(앱기획서 3.3). 뽑기 종류 선택과 팩 선택을 두 단계로
 * 나누지 않는다 — 종류가 둘뿐이라 캐러셀도 쓰지 않는다. 한 화면에 다 보이면 비교가 된다.
 *
 * **카드를 누르면 개봉 전체화면으로 간다.** 장수(1장 / 10연차) 선택은 거기서 한다 —
 * 좁은 카드 안에 버튼 두 개를 넣으면 팩보다 버튼이 먼저 눈에 들어온다.
 *
 * 포인트가 부족하면 **흐리게 + "포인트 부족"** 이고 누를 수 없다(앱기획서 3.3).
 * 눌러서 실패를 알리는 방식은 택하지 않았다 — 눌러 보기 전에 알 수 있어야 한다.
 *
 * 테두리를 쓰지 않는다(디자인 가이드 5장) — 흰 카드 + 그림자만.
 */
export interface PackCardProps {
  readonly type: DrawType
  readonly points: number
  readonly onPress: (type: DrawType) => void
}

const IMAGE_INSET = SPACING.md

/**
 * 팩 이미지 폭 — **고정값**이다.
 *
 * `onLayout` 으로 카드 폭을 재서 맞추면 첫 프레임에 팩이 없다가 나타난다. 가장 좁은
 * 기기(375)에서도 카드 폭이 `(375 - 32 - 12) / 2 = 165`, 안쪽 여백을 빼면 133 이라
 * 120 은 여유 있게 들어간다. 화면 폭이 커져도 팩이 커질 필요는 없다 —
 * 목록에서는 **어떤 팩인지 알아보는 것**이 목적이고, 크게 보는 곳은 개봉 화면이다.
 */
const PACK_WIDTH = 120

export const PackCard = ({ type, points, onPress }: PackCardProps) => {
  const cost = DRAW_COST_SINGLE[type]
  const affordable = points >= cost

  return (
    <Pressable
      onPress={() => {
        onPress(type)
      }}
      disabled={!affordable}
      accessibilityRole="button"
      accessibilityLabel={`${DRAW_TYPE_LABEL[type]} ${formatPoints(cost)}`}
      accessibilityState={{ disabled: !affordable }}
      style={({ pressed }) => [
        styles.card,
        !affordable ? styles.locked : null,
        pressed && affordable ? styles.pressed : null,
      ]}
    >
      <View style={styles.art}>
        <PackImage type={type} width={PACK_WIDTH} />
      </View>

      <Text variant="button" align="center" color={affordable ? 'textStrong' : 'textDisabled'}>
        {DRAW_TYPE_LABEL[type]}
      </Text>

      {affordable ? (
        <Text variant="buttonSmall" align="center" color="primary">
          {formatPoints(cost)}
        </Text>
      ) : (
        <View style={styles.lockedLine}>
          <Ionicons name="lock-closed" size={11} color={COLORS.textDisabled} />
          <Text variant="caption" color="textDisabled">
            포인트 부족
          </Text>
        </View>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md,
    paddingHorizontal: IMAGE_INSET,
    gap: SPACING.xs,
    alignItems: 'center',
    ...shadowStyle('card'),
  },
  art: { marginBottom: SPACING.sm + 2 },
  locked: { opacity: 0.45 },
  // 눌림은 배경색으로 알린다 — scale 은 카드가 클 때 위아래에 틈이 생겨 깜빡인다
  pressed: { backgroundColor: COLORS.surface },
  lockedLine: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
})
