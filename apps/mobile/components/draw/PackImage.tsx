import { Image } from 'expo-image'
import { StyleSheet, View } from 'react-native'
import type { ImageStyle } from 'expo-image'
import type { DrawType } from '@kbokkang/shared'

import packNormalBody from '@/assets/packs/pack-normal-body.webp'
import packNormalTop from '@/assets/packs/pack-normal-top.webp'
import packPremiumBody from '@/assets/packs/pack-premium-body.webp'
import packPremiumTop from '@/assets/packs/pack-premium-top.webp'

/**
 * 카드팩 이미지.
 *
 * ## 팩은 상단/하단 두 장이다
 *
 * 개봉 연출에서 **상단만 위로 날려 보내야** 하기 때문이다(디자인 가이드 7.2).
 * 한 장으로 두고 마스크를 씌우는 방법도 있지만 RN 에서 마스크는 무겁고, 톱니 모양
 * 밀봉선이 있어 사각 마스크로는 잘린 자리가 부자연스럽다.
 *
 * ⚠️ 두 장의 **가로 폭은 같고 세로만 다르다.** 그래서 폭만 받고 높이는 각 이미지의
 *    원본 비율로 계산한다 — 높이를 밖에서 주면 두 장이 어긋난다.
 *
 * `top` 없이 `body` 만 쓰면 붙어 있는 팩처럼 보이지 않는다. 목록에서는 두 장을 세로로
 * 이어 붙여 온전한 팩으로 보여주고, 개봉 화면에서는 두 장을 따로 배치해 애니메이션한다.
 */

/** 원본 픽셀 크기 — 비율 계산에 쓴다. 이미지를 교체하면 여기도 고친다. */
const SOURCE = {
  normal: { top: { width: 760, height: 184 }, body: { width: 760, height: 1182 } },
  premium: { top: { width: 765, height: 184 }, body: { width: 765, height: 1182 } },
} as const

const ASSET = {
  normal: { top: packNormalTop, body: packNormalBody },
  premium: { top: packPremiumTop, body: packPremiumBody },
} as const

export type PackPart = 'top' | 'body'

/** 폭이 주어졌을 때 그 조각의 높이 */
export const packPartHeight = (type: DrawType, part: PackPart, width: number): number =>
  (width * SOURCE[type][part].height) / SOURCE[type][part].width

/** 팩 전체(상단+하단) 높이 */
export const packHeight = (type: DrawType, width: number): number =>
  packPartHeight(type, 'top', width) + packPartHeight(type, 'body', width)

export interface PackPartImageProps {
  readonly type: DrawType
  readonly part: PackPart
  readonly width: number
  readonly style?: ImageStyle
}

/** 조각 하나. 개봉 화면이 상단/하단을 따로 움직일 때 쓴다 */
export const PackPartImage = ({ type, part, width, style }: PackPartImageProps) => (
  <Image
    source={ASSET[type][part]}
    style={[{ width, height: packPartHeight(type, part, width) }, style]}
    contentFit="fill"
    // 팩은 몇 장뿐이고 개봉 때 즉시 보여야 한다 — 페이드인이 있으면 늦게 뜬 것처럼 보인다
    transition={0}
  />
)

export interface PackImageProps {
  readonly type: DrawType
  readonly width: number
}

/** 온전한 팩 — 상단과 하단을 세로로 이어 붙인다 */
export const PackImage = ({ type, width }: PackImageProps) => (
  <View style={styles.stack}>
    <PackPartImage type={type} part="top" width={width} />
    <PackPartImage type={type} part="body" width={width} />
  </View>
)

const styles = StyleSheet.create({
  // 두 조각 사이에 1px 틈이 생기지 않게 붙인다
  stack: { alignItems: 'center' },
})
