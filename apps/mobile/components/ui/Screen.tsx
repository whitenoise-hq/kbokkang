import type { ReactNode } from 'react'
import { StyleSheet, View } from 'react-native'
import { SafeAreaView, type Edge } from 'react-native-safe-area-context'
import { COLORS, SCREEN_PADDING } from '@/theme/colors'

/**
 * 화면 컨테이너 — SafeArea + 기본 배경/좌우 패딩.
 *
 * 화면마다 SafeArea·패딩을 다시 쓰지 않도록 여기서 한 번에 처리한다.
 */
export interface ScreenProps {
  readonly children: ReactNode
  /** 좌우 패딩 제거 — 전체 폭 리스트/카드에 쓴다 */
  readonly flush?: boolean
  /** SafeArea 를 적용할 방향. 기본 상·하 */
  readonly edges?: readonly Edge[]
}

const DEFAULT_EDGES: readonly Edge[] = ['top', 'bottom']

export const Screen = ({ children, flush = false, edges = DEFAULT_EDGES }: ScreenProps) => (
  <SafeAreaView style={styles.safe} edges={edges}>
    <View style={[styles.content, flush ? null : styles.padded]}>{children}</View>
  </SafeAreaView>
)

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  content: { flex: 1 },
  padded: { paddingHorizontal: SCREEN_PADDING },
})
