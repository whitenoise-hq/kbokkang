import type { ReactNode } from 'react'
import { Pressable, StyleSheet } from 'react-native'
import { COLORS, RADIUS, SPACING } from '@/theme/colors'

/**
 * 세그먼트 한 칸 — 원정 / 무승부 / 홈 중 하나.
 *
 * **선택은 배경색으로만 알린다.** 선택된 칸은 옅은 파랑(`primaryLight`), 적중한 칸은
 * 옅은 초록(`successLight`) 으로 채워지고 글자색이 함께 바뀐다.
 *
 * ⚠️ **테두리를 쓰지 않는다 — 선택된 칸도 마찬가지다**(디자인 가이드 5장).
 *    칸마다 테두리를 두면 카드 테두리와 겹쳐 "액자 안의 액자"가 되고, 선택된 칸에만
 *    테두리를 둬도 선이 한 겹 더 생겨 산만하다. 칸 구분은 `PickSegment` 의 divider,
 *    선택 표시는 배경색이 담당한다.
 *
 * ⚠️ **눌림 피드백에 `scale` 을 쓰지 않는다.** 중앙 기준으로 축소되면서 위아래에 틈이
 *    생겨 깜빡인다(겪었다). 배경색 변화로 알린다.
 */
export interface PickCellProps {
  readonly selected: boolean
  /** 정산 후 이 선택지가 맞았는지 — 초록 배경으로 바뀐다 */
  readonly won?: boolean
  /** 고정 폭으로 좁게. 무승부 칸에 쓴다 */
  readonly narrow?: boolean
  readonly align?: 'start' | 'center' | 'end'
  readonly onPress?: () => void
  readonly children: ReactNode
}

/** 무승부 칸 폭. 두 자리 스코어("11 : 13")까지 들어가야 한다. */
const NARROW_WIDTH = 76

export const PickCell = ({
  selected,
  won = false,
  narrow = false,
  align = 'center',
  onPress,
  children,
}: PickCellProps) => {
  const filled = selected || won

  return (
    <Pressable
      onPress={onPress}
      disabled={onPress === undefined}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={({ pressed }) => [
        styles.cell,
        narrow ? styles.narrow : styles.grow,
        ALIGN_STYLE[align],
        won ? styles.won : selected ? styles.picked : null,
        pressed && onPress !== undefined && !filled ? styles.pressed : null,
      ]}
    >
      {children}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  cell: {
    minHeight: 44,
    justifyContent: 'center',
    borderRadius: RADIUS.sm + 2,
    paddingHorizontal: SPACING.sm + 4,
    paddingVertical: SPACING.xs + 2,
  },
  grow: { flex: 1 },
  narrow: { width: NARROW_WIDTH },
  alignStart: { alignItems: 'flex-start' },
  alignCenter: { alignItems: 'center' },
  alignEnd: { alignItems: 'flex-end' },
  picked: { backgroundColor: COLORS.primaryLight },
  won: { backgroundColor: COLORS.successLight },
  // 회색 홈보다 한 단계 진하게 — 누른 칸만 살짝 내려앉아 보인다
  pressed: { backgroundColor: COLORS.border },
})

const ALIGN_STYLE = {
  start: styles.alignStart,
  center: styles.alignCenter,
  end: styles.alignEnd,
} as const
