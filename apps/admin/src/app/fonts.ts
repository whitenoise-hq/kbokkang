import localFont from 'next/font/local'

/**
 * Pretendard 로컬 폰트. 파일은 `packages/assets/fonts/pretendard/web/` 공용 위치를 참조한다.
 * 웹은 woff2(한글 상용 subset), 앱(RN)은 같은 패키지의 native/*.otf 를 사용한다.
 */
export const pretendard = localFont({
  src: [
    {
      path: '../../../../packages/assets/fonts/pretendard/web/Pretendard-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../../../packages/assets/fonts/pretendard/web/Pretendard-SemiBold.woff2',
      weight: '600',
      style: 'normal',
    },
    {
      path: '../../../../packages/assets/fonts/pretendard/web/Pretendard-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-pretendard',
  display: 'swap',
  // subset 폰트에 없는 희귀 글자는 아래 시스템 폰트로 자연스럽게 폴백된다.
  fallback: ['system-ui', '-apple-system', 'Segoe UI', 'Apple SD Gothic Neo', 'sans-serif'],
})
