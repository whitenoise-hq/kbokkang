import { ActivityIndicator, Pressable, StyleSheet } from 'react-native'
import { BUTTON_HEIGHT, COLORS, PRESS_SCALE, RADIUS, SPACING } from '@/theme/colors'
import { Text } from './Text'

/**
 * 버튼 — 디자인 가이드 6장.
 *
 * - 메인: `primary` 배경 + 흰 텍스트. 눌림 시 `primaryPressed` + `scale(0.98)`
 * - 보조: `surface` 배경 + `textNormal` 텍스트
 *
 * 높이는 기본 52(`BUTTON_HEIGHT`). 카드 **안에** 들어가는 버튼은 52 가 과해서
 * `compact`(36)를 쓴다 — 선택 버튼(38)보다 살짝 낮춰 위계를 만든다.
 */
export interface ButtonProps {
  readonly label: string
  readonly onPress: () => void
  readonly variant?: 'primary' | 'secondary'
  readonly disabled?: boolean
  readonly loading?: boolean
  /** 카드 안에 들어갈 때 — 높이 44 */
  readonly compact?: boolean
}

const COMPACT_HEIGHT = 36

export const Button = ({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  compact = false,
}: ButtonProps) => {
  const blocked = disabled || loading

  return (
    <Pressable
      onPress={onPress}
      disabled={blocked}
      accessibilityRole="button"
      accessibilityState={{ disabled: blocked, busy: loading }}
      style={({ pressed }) => [
        styles.button,
        { height: compact ? COMPACT_HEIGHT : BUTTON_HEIGHT },
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
          variant="button"
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
  primary: { backgroundColor: COLORS.primary },
  secondary: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  primaryPressed: { backgroundColor: COLORS.primaryPressed },
  blocked: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  pressed: { transform: [{ scale: PRESS_SCALE }] },
})
