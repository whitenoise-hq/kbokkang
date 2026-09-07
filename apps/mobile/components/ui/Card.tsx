import type { ReactNode } from 'react'
import { StyleSheet, View, type ViewStyle } from 'react-native'
import { COLORS, RADIUS, SPACING } from '@/theme/colors'
import { shadowStyle } from '@/theme/shadow'

/**
 * 카드 컨테이너 — 디자인 가이드 6장.
 *
 * 은은한 그림자만 쓴다. 진한 그림자는 금지(토스 감성을 해친다).
 * iOS 는 shadow* 속성, Android 는 elevation 이지만 iOS 전용이라 shadow 만 쓴다.
 */
export interface CardProps {
  readonly children: ReactNode
  readonly style?: ViewStyle
  /** 내부 패딩 제거 — 리스트를 꽉 채울 때 */
  readonly flush?: boolean
}

export const Card = ({ children, style, flush = false }: CardProps) => (
  <View style={[styles.card, flush ? null : styles.padded, style]}>{children}</View>
)

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    ...shadowStyle('card'),
  },
  padded: { padding: SPACING.md },
})
