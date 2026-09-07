import type { ReactNode } from 'react'
import { StyleSheet, View } from 'react-native'
import { SafeAreaView, type Edge } from 'react-native-safe-area-context'
import { COLORS, SCREEN_PADDING } from '@/theme/colors'

/**
 * 화면 컨테이너 — SafeArea + 기본 배경/좌우 패딩.
 *
 * 화면마다 SafeArea·패딩을 다시 쓰지 않도록 여기서 한 번에 처리한다.
 *
 * ⚠️ **기본값은 상단 인셋만이다(`['top']`).** 탭 화면에서 `bottom` 을 함께 주면
 * **하단 인셋이 이중으로 적용된다** — 탭 바가 이미 홈 인디케이터 영역을 처리하는데
 * 화면이 또 패딩을 넣어서 탭 바 위에 흰 띠가 생긴다(실제로 그렇게 보였다).
 *
 * 탭 밖의 전체화면(뽑기 연출·모달 등)에서 하단 인셋이 필요하면 `edges` 로 직접 준다.
 *
 * ⚠️ **화면 배경은 `surface`(연회색), 카드는 `background`(흰색)** 다. 둘 다 흰색이면
 * 카드와 배경, 그리고 탭 바까지 구분이 안 된다 — 어드민에서 똑같이 겪고 고친 문제다.
 * 디자인 가이드의 토큰 이름(`background` = 기본 배경)과 반대로 쓰는 셈이니 주의.
 */
export interface ScreenProps {
  readonly children: ReactNode
  /** 좌우 패딩 제거 — 전체 폭 리스트/카드에 쓴다 */
  readonly flush?: boolean
  /** SafeArea 를 적용할 방향. 기본 상·하 */
  readonly edges?: readonly Edge[]
}

const DEFAULT_EDGES: readonly Edge[] = ['top']

export const Screen = ({ children, flush = false, edges = DEFAULT_EDGES }: ScreenProps) => (
  <SafeAreaView style={styles.safe} edges={edges}>
    <View style={[styles.content, flush ? null : styles.padded]}>{children}</View>
  </SafeAreaView>
)

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.surface },
  content: { flex: 1 },
  padded: { paddingHorizontal: SCREEN_PADDING },
})
