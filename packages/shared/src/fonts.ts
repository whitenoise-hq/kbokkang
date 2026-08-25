/**
 * 폰트 정의 — 앱/어드민 공통. 실제 파일은 `packages/assets/fonts/` 에 둔다.
 * 04_앱디자인가이드.md 2장 기준(Pretendard 권장, 숫자는 tabular-nums).
 *
 * 포맷 주의: 웹(admin)은 .woff2, React Native(mobile)은 .otf/.ttf 만 사용 가능.
 */

import type { FontWeightToken } from './theme'

export const FONT_FAMILY = 'Pretendard'

/** 디자인 토큰 weight → CSS/RN 수치 */
export const FONT_WEIGHT: Record<FontWeightToken, number> = {
  regular: 400,
  semibold: 600,
  bold: 700,
} as const

/**
 * RN에서 참조할 폰트 패밀리 이름.
 * RN(Android)은 weight 합성이 불안정해서 굵기별로 별도 패밀리를 등록해 쓴다.
 */
export const RN_FONT_FAMILY: Record<FontWeightToken, string> = {
  regular: 'Pretendard-Regular',
  semibold: 'Pretendard-SemiBold',
  bold: 'Pretendard-Bold',
} as const

/** 폰트 로딩 실패 시 폴백 스택 (웹) */
export const WEB_FONT_FALLBACK = [
  'system-ui',
  '-apple-system',
  'Segoe UI',
  'Apple SD Gothic Neo',
  'sans-serif',
] as const
