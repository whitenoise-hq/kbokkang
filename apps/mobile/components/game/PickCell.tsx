import type { ReactNode } from 'react'
import { Pressable, StyleSheet } from 'react-native'
import { COLORS, RADIUS, SPACING } from '@/theme/colors'

/**
 * 3열 그리드(원정 / 무승부 / 홈)의 한 칸.
 *
 * 홈 화면의 예측 세그먼트(`PickSegment` + `GameCard`)와 예측 탭의 기록 한 줄
 * (`PredictionRow`)이 **같은 칸을 쓴다.** 두 화면이 같은 위치·같은 폭이라야 앱 안에서
 * 같은 것으로 읽힌다 — 예측 탭을 따로 만들었더니 팀명 길이 때문에 행마다 콜론 위치가
 * 달라져 정렬이 깨져 보였다(겪었다).
 *
 * ## 상태는 배경색으로만 알린다
 *
 * `fill` 하나로 표현한다 — 테두리를 쓰지 않는다(디자인 가이드 5장).
 *
 * | fill | 뜻 | 색 |
 * |---|---|---|
 * | `none` | 고르지 않음 | 없음 |
 * | `primary` | **결과 전** 내 선택 | `primaryLight` |
 * | `success` | 적중 | `successLight` |
 * | `muted` | **내 선택이지만 적중이 아니다**(미적중·결과 대기) | `surface` |
 *
 * `primary`(파랑)를 결과가 나온 뒤에 쓰지 않는다 — 파랑은 "고를 수 있다/골랐다"는
 * 진행 중 상태여서, 끝난 경기에 쓰면 아직 바꿀 수 있는 것처럼 읽힌다.
 *
 * ⚠️ **눌림 피드백에 `scale` 을 쓰지 않는다.** 중앙 기준으로 축소되면서 위아래에 틈이
 *    생겨 깜빡인다(겪었다). 배경색 변화로 알린다.
 */
export type PickCellFill = 'none' | 'primary' | 'success' | 'muted'

export interface PickCellProps {
  readonly fill: PickCellFill
  /** 고정 폭으로 좁게. 무승부·스코어 칸에 쓴다 */
  readonly narrow?: boolean
  readonly align?: 'start' | 'center' | 'end'
  /** 없으면 누를 수 없다(지난 기록) */
  readonly onPress?: () => void
  readonly children: ReactNode
}

/** 무승부·스코어 칸 폭. 두 자리 스코어("11 : 13")까지 들어가야 한다. */
const NARROW_WIDTH = 76

export const PickCell = ({
  fill,
  narrow = false,
  align = 'center',
  onPress,
  children,
}: PickCellProps) => (
  <Pressable
    onPress={onPress}
    disabled={onPress === undefined}
    accessibilityRole="button"
    accessibilityState={{ selected: fill !== 'none' }}
    style={({ pressed }) => [
      styles.cell,
      narrow ? styles.narrow : styles.grow,
      ALIGN_STYLE[align],
      FILL_STYLE[fill],
      pressed && onPress !== undefined && fill === 'none' ? styles.pressed : null,
    ]}
  >
    {children}
  </Pressable>
)

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
  fillNone: {},
  fillPrimary: { backgroundColor: COLORS.primaryLight },
  fillSuccess: { backgroundColor: COLORS.successLight },
  fillMuted: { backgroundColor: COLORS.surface },
  // 회색 홈보다 한 단계 진하게 — 누른 칸만 살짝 내려앉아 보인다
  pressed: { backgroundColor: COLORS.border },
})

const ALIGN_STYLE = {
  start: styles.alignStart,
  center: styles.alignCenter,
  end: styles.alignEnd,
} as const

const FILL_STYLE = {
  none: styles.fillNone,
  primary: styles.fillPrimary,
  success: styles.fillSuccess,
  muted: styles.fillMuted,
} as const
