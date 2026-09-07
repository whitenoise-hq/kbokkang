/**
 * 폰트/이미지 에셋 모듈 선언.
 *
 * Expo 가 `expo-env.d.ts` 를 생성해 주지만 그 파일은 gitignore 되고 `expo start` 전에는
 * 없다 — 그것만 믿으면 깨끗한 체크아웃에서 타입체크가 깨진다. 그래서 직접 선언한다.
 *
 * RN 에서 에셋 import 는 번들러가 등록한 **숫자 핸들**로 해석된다(경로 문자열이 아니다).
 */
declare module '*.otf' {
  const asset: number
  export default asset
}

declare module '*.png' {
  const asset: number
  export default asset
}
