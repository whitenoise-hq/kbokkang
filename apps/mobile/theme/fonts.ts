import PretendardBold from '@kbokkang/assets/fonts/pretendard/native/Pretendard-Bold.otf'
import PretendardRegular from '@kbokkang/assets/fonts/pretendard/native/Pretendard-Regular.otf'
import PretendardSemiBold from '@kbokkang/assets/fonts/pretendard/native/Pretendard-SemiBold.otf'
import type { FontWeightToken } from '@kbokkang/shared'

/**
 * Pretendard 폰트 패밀리 매핑.
 *
 * ⚠️ **커스텀 `fontFamily` 에 `fontWeight` 를 함께 주면 안 된다.** 굵기별 파일이 각각
 * 별도 패밀리로 등록되기 때문에, 두 값을 같이 주면 시스템 폰트로 폴백된다(플레이북 9번).
 * 굵기는 **패밀리 이름으로만** 지정하고 `fontWeight` 는 쓰지 않는다.
 *
 * 이 매핑을 거치는 `components/ui/Text.tsx` 만 쓰면 화면 코드에서 실수할 여지가 없다.
 */
export const FONT_FAMILY: Record<FontWeightToken, string> = {
  regular: 'Pretendard-Regular',
  semibold: 'Pretendard-SemiBold',
  bold: 'Pretendard-Bold',
}

/** `expo-font` 로 로드할 폰트 맵. 파일은 `packages/assets` 에 한 벌만 둔다. */
export const FONT_ASSETS = {
  'Pretendard-Regular': PretendardRegular,
  'Pretendard-SemiBold': PretendardSemiBold,
  'Pretendard-Bold': PretendardBold,
} as const
