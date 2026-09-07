import type { ReactNode } from 'react'
import { StyleSheet, View, type ViewStyle } from 'react-native'
import { COLORS, RADIUS, SPACING } from '@/theme/colors'
import { shadowStyle } from '@/theme/shadow'

/**
 * 카드 컨테이너 — 디자인 가이드 6장.
 *
 * **그림자만 쓴다 — 테두리는 두지 않는다**(디자인 가이드 5장). 테두리를 뒀더니 카드 안의
 * 요소들이 각자 또 테두리를 갖게 되어 "액자 안의 액자"가 됐다. 흰 카드는 회색 화면
 * (`surface`) 위에서 배경 대비만으로 충분히 떠 보인다.
 *
 * 그림자는 은은하게. 진한 그림자는 금지(토스 감성을 해친다).
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
    ...shadowStyle('card'),
  },
  padded: { padding: SPACING.md },
})
