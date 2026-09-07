import type { ViewStyle } from 'react-native'
import { SHADOW, type ShadowToken } from './colors'

/**
 * 디자인 토큰의 그림자를 RN 스타일로 변환한다.
 *
 * 토큰은 CSS 감각(`offsetY` / `blur` / `rgba` 색)으로 정의돼 있고 RN 은 속성 이름이 다르다.
 * 화면마다 변환하면 값이 흔들리므로 여기서 한 번만 한다.
 *
 * 알파는 토큰의 `color`(rgba)에 이미 들어 있으므로 `shadowOpacity` 는 1 이다.
 * (RN 의 shadowOpacity 는 색 알파에 곱해진다 — 둘 다 주면 두 번 곱해져 흐려진다)
 */
export const shadowStyle = (token: ShadowToken): ViewStyle => {
  const shadow = SHADOW[token]

  return {
    shadowColor: shadow.color,
    shadowOffset: { width: 0, height: shadow.offsetY },
    shadowRadius: shadow.blur,
    shadowOpacity: 1,
  }
}
