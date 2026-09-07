import { StyleSheet, View } from 'react-native'
import { COLORS, RADIUS, SPACING, type ColorToken } from '@/theme/colors'
import { Text } from './Text'

/**
 * 상태 배지 — 알약(full) 형태. 디자인 가이드 6장.
 *
 * 배경은 색 토큰의 연한 버전이 필요하지만 토큰에 알파 변형이 없다.
 * RN 은 CSS 처럼 `color-mix` 를 못 쓰므로 **투명도를 배경에 얹는 방식**으로 처리한다.
 */
export interface BadgeProps {
  readonly label: string
  /** 배지 색 토큰. 텍스트는 이 색, 배경은 같은 색의 연한 버전 */
  readonly tone?: ColorToken
}

/** 배경 알파 — 은은하게. 진하면 배지가 버튼처럼 보인다. */
const BACKGROUND_ALPHA = '1A'

export const Badge = ({ label, tone = 'textAlt' }: BadgeProps) => (
  <View style={[styles.badge, { backgroundColor: `${COLORS[tone]}${BACKGROUND_ALPHA}` }]}>
    <Text variant="caption" color={tone} style={styles.label}>
      {label}
    </Text>
  </View>
)

const styles = StyleSheet.create({
  badge: {
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  label: { lineHeight: 16 },
})
