import type { ReactNode } from 'react'
import { StyleSheet, View } from 'react-native'
import { COLORS, RADIUS, SPACING } from '@/theme/colors'

/**
 * 선택 영역 컨테이너 — `surface` 회색 한 덩어리.
 *
 * 세 칸(원정 / 무승부 / 홈)을 담고 **구분은 얇은 divider 만** 한다.
 * 칸마다 테두리를 두면 카드와 겹쳐 "액자 안의 액자"가 된다(디자인 가이드 5장).
 *
 * ⚠️ **divider 는 채워진 칸 양옆에서 숨긴다.** 색이 찬 칸에 선이 붙으면 칸이 잘려 보인다.
 *    그래서 divider 를 CSS 테두리가 아니라 **별도 요소**로 두고 조건부로 비운다.
 */
export interface PickSegmentProps {
  readonly away: ReactNode
  readonly draw: ReactNode
  readonly home: ReactNode
  /** 어느 칸이 색으로 채워져 있는지 — 그 양옆 divider 를 숨긴다 */
  readonly filled: 'away' | 'draw' | 'home' | null
}

export const PickSegment = ({ away, draw, home, filled }: PickSegmentProps) => (
  <View style={styles.segment}>
    {away}
    <View style={[styles.divider, filled === 'away' || filled === 'draw' ? styles.hidden : null]} />
    {draw}
    <View style={[styles.divider, filled === 'draw' || filled === 'home' ? styles.hidden : null]} />
    {home}
  </View>
)

const styles = StyleSheet.create({
  segment: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: 3,
  },
  divider: {
    width: 1,
    marginVertical: SPACING.sm + 2,
    backgroundColor: COLORS.border,
  },
  hidden: { backgroundColor: 'transparent' },
})
