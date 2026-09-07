import type { ReactNode } from 'react'
import { Pressable, StyleSheet } from 'react-native'
import { COLORS, RADIUS, SPACING } from '@/theme/colors'

/**
 * 경기 카드의 선택 셀 — 3열(원정 / 무승부 / 홈) 중 하나.
 *
 * **팀 표시와 선택 버튼을 하나로 합친 것.** 처음엔 팀 원을 보여주는 행과 "두산 승" 버튼 행을
 * 따로 뒀는데 같은 정보를 두 번 쓰는 셈이라 카드가 길고 산만했다. 셀 자체가 선택지다.
 *
 * ⚠️ **눌림 피드백에 `scale` 을 쓰지 않는다.** 셀이 중앙으로 축소되면서 위아래에 1px 틈이
 *    생기고 뒤의 카드 배경이 드러나 깜빡였다(실제로 그렇게 보였다). 전체 폭 세그먼트에는
 *    축소가 맞지 않는다 — **배경색 변화**로 누른 것을 알린다.
 *
 * ⚠️ 인접 셀의 테두리가 겹치도록 `marginRight: -1` 을 쓴다(세그먼트 컨트롤 방식).
 *    강조된 셀은 `zIndex` 로 위에 올려 테두리가 끊기지 않게 한다.
 *
 * 셀 내부 배치는 **자식이 정한다**(방향을 강제하지 않는다) — 팀 칸은 마크+이름을 가로로,
 * 무승부 칸은 스코어+라벨을 세로로 쌓기 때문이다.
 */
export type CellPosition = 'left' | 'middle' | 'right'

export interface PickCellProps {
  readonly position: CellPosition
  readonly selected: boolean
  /** 정산 후 이 선택지가 맞았는지 — 초록 강조 */
  readonly won?: boolean
  /**
   * 고정 폭으로 좁게. 무승부 칸에 쓴다 — 팀 칸과 같은 폭을 주면
   * 가운데가 과하게 넓어 보인다.
   */
  readonly narrow?: boolean
  /**
   * 셀 안 내용의 가로 정렬. 팀 칸은 **바깥쪽 끝**으로 붙인다 —
   * 원정은 왼쪽, 홈은 오른쪽. 가운데 정렬하면 세 칸이 안쪽으로 뭉쳐 보인다.
   */
  readonly align?: 'start' | 'center' | 'end'
  readonly onPress?: () => void
  readonly children: ReactNode
}

/** 무승부 칸 폭. 두 자리 스코어("11 : 13")까지 들어가야 한다. */
const NARROW_WIDTH = 82

export const PickCell = ({
  position,
  selected,
  won = false,
  narrow = false,
  align = 'center',
  onPress,
  children,
}: PickCellProps) => {
  const highlight = won ? 'won' : selected ? 'picked' : 'idle'

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
        POSITION_STYLE[position],
        styles[highlight],
        pressed && onPress !== undefined ? styles.pressed : null,
      ]}
    >
      {children}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  cell: {
    minHeight: 58,
    justifyContent: 'center',
    borderWidth: 1,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
  },
  grow: { flex: 1 },
  narrow: { width: NARROW_WIDTH },
  alignStart: { alignItems: 'flex-start' },
  alignCenter: { alignItems: 'center' },
  alignEnd: { alignItems: 'flex-end' },
  left: {
    borderTopLeftRadius: RADIUS.md,
    borderBottomLeftRadius: RADIUS.md,
    marginRight: -1,
  },
  middle: { marginRight: -1 },
  right: {
    borderTopRightRadius: RADIUS.md,
    borderBottomRightRadius: RADIUS.md,
  },
  idle: { backgroundColor: COLORS.background, borderColor: COLORS.border },
  picked: { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primary, zIndex: 1 },
  won: { backgroundColor: `${COLORS.success}14`, borderColor: COLORS.success, zIndex: 1 },
  // scale 대신 배경만 눌러진 느낌으로
  pressed: { backgroundColor: COLORS.surface },
})

const POSITION_STYLE = {
  left: styles.left,
  middle: styles.middle,
  right: styles.right,
} as const

const ALIGN_STYLE = {
  start: styles.alignStart,
  center: styles.alignCenter,
  end: styles.alignEnd,
} as const
