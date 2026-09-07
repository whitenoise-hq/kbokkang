import { ActivityIndicator, Pressable, StyleSheet } from 'react-native'
import { BUTTON_HEIGHT, COLORS, PRESS_SCALE, RADIUS, SPACING } from '@/theme/colors'
import { Text } from './Text'

/**
 * 버튼 — 디자인 가이드 6장.
 *
 * - 메인: `primary` 배경 + 흰 텍스트. 눌림 시 `primaryPressed` + `scale(0.98)`
 * - 보조: `surface` 배경 + `textNormal` 텍스트
 *
 * **테두리를 두지 않는다**(디자인 가이드 5장) — 보조 버튼도 배경 대비로만 구분한다.
 *
 * ## 크기
 *
 * | size | 높이 | 쓰는 곳 |
 * |---|---|---|
 * | `default` | 52 | 화면 하단 주요 동작 |
 * | `compact` | 36 | 카드 안 주요 동작 |
 * | `small` | 28 | **카드 헤더의 남은 공간** — 버튼 때문에 카드가 커지면 안 되는 자리 |
 *
 * `small` 은 최소 터치 영역(44)보다 작으므로 `hitSlop` 으로 레이아웃 없이 영역만 넓힌다.
 *
 * `pill` 은 폭을 **내용만큼만** 쓰는 알약이다.
 * ⚠️ `pill` 은 폭을 스스로 정하지 않는다 — `flexDirection: 'row'` 컨테이너에 넣어야
 *    내용 폭이 된다(그냥 `View` 에 넣으면 늘어난다).
 */
export interface ButtonProps {
  readonly label: string
  readonly onPress: () => void
  readonly variant?: 'primary' | 'secondary'
  readonly size?: 'default' | 'compact' | 'small'
  readonly disabled?: boolean
  readonly loading?: boolean
  /** 내용 폭 알약 */
  readonly pill?: boolean
}

const HEIGHT = {
  default: BUTTON_HEIGHT,
  compact: 36,
  small: 28,
} as const

/** `small` 이 44 터치 영역을 채우도록 — (44 - 28) / 2 */
const SMALL_HIT_SLOP = 8

export const Button = ({
  label,
  onPress,
  variant = 'primary',
  size = 'default',
  disabled = false,
  loading = false,
  pill = false,
}: ButtonProps) => {
  const blocked = disabled || loading
  const small = size === 'small'

  return (
    <Pressable
      onPress={onPress}
      disabled={blocked}
      accessibilityRole="button"
      accessibilityState={{ disabled: blocked, busy: loading }}
      hitSlop={small ? SMALL_HIT_SLOP : undefined}
      style={({ pressed }) => [
        styles.button,
        { height: HEIGHT[size] },
        small ? styles.smallPadding : null,
        pill ? styles.pill : null,
        variant === 'primary' ? styles.primary : styles.secondary,
        blocked ? styles.blocked : null,
        pressed && !blocked ? styles.pressed : null,
        pressed && !blocked && variant === 'primary' ? styles.primaryPressed : null,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? COLORS.background : COLORS.textNormal}
          size="small"
        />
      ) : (
        <Text
          variant={small ? 'buttonSmall' : 'button'}
          color={blocked ? 'textDisabled' : variant === 'primary' ? 'background' : 'textNormal'}
        >
          {label}
        </Text>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  button: {
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.md,
  },
  smallPadding: { paddingHorizontal: SPACING.sm + 4 },
  pill: { borderRadius: RADIUS.full },
  primary: { backgroundColor: COLORS.primary },
  secondary: { backgroundColor: COLORS.surface },
  primaryPressed: { backgroundColor: COLORS.primaryPressed },
  blocked: { backgroundColor: COLORS.surface },
  pressed: { transform: [{ scale: PRESS_SCALE }] },
})
