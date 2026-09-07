import { Text as RNText, StyleSheet, type TextProps as RNTextProps } from 'react-native'
import { COLORS, TYPOGRAPHY, type ColorToken, type TypographyToken } from '@/theme/colors'
import { FONT_FAMILY } from '@/theme/fonts'

/**
 * 토큰 기반 Text.
 *
 * ⚠️ 화면에서 `react-native` 의 `Text` 를 직접 쓰지 말고 이걸 쓴다. 이유는 두 가지다:
 * 1. **폰트 굵기 함정** — 커스텀 폰트는 `fontWeight` 를 같이 주면 시스템 폰트로 폴백된다.
 *    여기서 굵기 → `fontFamily` 로 변환하므로 화면 코드가 실수할 수 없다.
 * 2. 색·크기를 토큰으로만 받는다 — hex 직접 지정을 막는다.
 */
export interface TextProps extends Omit<RNTextProps, 'style'> {
  /** 타이포 토큰. 기본 body1 */
  readonly variant?: TypographyToken
  /** 색 토큰. 기본 textStrong */
  readonly color?: ColorToken
  readonly align?: 'left' | 'center' | 'right'
  readonly style?: RNTextProps['style']
}

export const Text = ({
  variant = 'body1',
  color = 'textStrong',
  align,
  style,
  ...rest
}: TextProps) => {
  const token = TYPOGRAPHY[variant]

  return (
    <RNText
      {...rest}
      style={StyleSheet.compose(
        {
          fontFamily: FONT_FAMILY[token.weight],
          fontSize: token.fontSize,
          color: COLORS[color],
          ...(align === undefined ? {} : { textAlign: align }),
        },
        style,
      )}
    />
  )
}
